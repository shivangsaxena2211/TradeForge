import type { Contract } from "ethers";
import type { PrismaClient } from "@/lib/generated/prisma/client";

import {
  buildVerifyRows,
  deactivateOnChainStock,
  ensureOnChainStockMapping,
  formatSetupTable,
  formatVerifyTable,
  scanOnChainStocks,
  type DatabaseStockForSetup,
  type SetupMappingRow,
  type SetupResult,
  type VerifyResult,
} from "./on-chain-stock-setup";

export async function runOnChainStockSetup(
  prisma: PrismaClient,
  contract: Contract,
): Promise<SetupResult> {
  const activeStocks = await prisma.stock.findMany({
    where: {
      isActive: true,
      simulationEnabled: true,
    },
    orderBy: [{ exchange: "asc" }, { symbol: "asc" }],
  });

  const inactiveStocks = await prisma.stock.findMany({
    where: {
      OR: [{ isActive: false }, { simulationEnabled: false }],
    },
    orderBy: [{ exchange: "asc" }, { symbol: "asc" }],
  });

  const index = await scanOnChainStocks(contract);
  const rows: SetupMappingRow[] = [];
  const errors: string[] = [];

  for (const stock of activeStocks) {
    try {
      const row = await ensureOnChainStockMapping(
        contract,
        index,
        stock as DatabaseStockForSetup,
      );

      await prisma.stock.update({
        where: { id: stock.id },
        data: { onChainStockId: row.onChainStockId },
      });

      rows.push(row);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown setup error.";
      errors.push(`${stock.exchange}:${stock.symbol}: ${message}`);
    }
  }

  for (const stock of inactiveStocks) {
    try {
      const deactivated = await deactivateOnChainStock(
        contract,
        index,
        stock.symbol,
      );

      if (deactivated) {
        rows.push({
          ...deactivated,
          exchange: stock.exchange,
          dbId: stock.id,
        });
      }

      const snapshot = index.get(stock.symbol.trim().toUpperCase());

      if (snapshot) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: { onChainStockId: snapshot.stockId },
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown deactivation error.";
      errors.push(`${stock.exchange}:${stock.symbol}: ${message}`);
    }
  }

  return { rows, errors };
}

export async function clearOnChainStockMappings(
  prisma: PrismaClient,
): Promise<number> {
  const result = await prisma.stock.updateMany({
    data: { onChainStockId: null },
  });

  return result.count;
}

export async function runOnChainStockVerification(
  prisma: PrismaClient,
  contract: Contract,
): Promise<VerifyResult> {
  const activeStocks = await prisma.stock.findMany({
    where: {
      isActive: true,
      simulationEnabled: true,
    },
    orderBy: [{ exchange: "asc" }, { symbol: "asc" }],
  });

  const index = await scanOnChainStocks(contract);

  return buildVerifyRows(activeStocks as DatabaseStockForSetup[], index);
}

export function printSetupResult(result: SetupResult): void {
  console.log(formatSetupTable(result.rows));

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  console.log(
    `\nMapped ${result.rows.filter((row) => row.action !== "deactivated").length} active stocks.`,
  );
}

export function printVerifyResult(result: VerifyResult): void {
  console.log(formatVerifyTable(result.rows));
  console.log(`\nPASS: ${result.passed}  FAIL: ${result.failed}`);

  if (result.failed > 0) {
    process.exitCode = 1;
  }
}
