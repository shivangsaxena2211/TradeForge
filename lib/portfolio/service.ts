import "server-only";

import { getPrismaClient } from "@/lib/db/client";
import {
  getServerOnChainHoldingsBySymbol,
  getServerVirtualCashInr,
} from "@/lib/blockchain/server-stock";
import { isBlockchainConnected } from "@/lib/blockchain/status";
import { decimalToNumber } from "@/lib/market/calculations";
import { getWalletByUserId } from "@/lib/wallet/repository";

import {
  aggregatePortfolioMetrics,
  computeAllocationPercent,
  computeHoldingMetrics,
} from "./calculations";
import type { HoldingRow, PortfolioSnapshot } from "./types";

function quantitiesMatch(
  databaseQuantity: string,
  onChainQuantity: string,
): boolean {
  const database = Number(databaseQuantity);
  const onChain = Number(onChainQuantity);

  if (!Number.isFinite(database) || !Number.isFinite(onChain)) {
    return databaseQuantity === onChainQuantity;
  }

  return Math.abs(database - onChain) < 0.00000001;
}

export async function getPortfolioForUser(
  userId: string,
): Promise<PortfolioSnapshot> {
  const prisma = getPrismaClient();
  const wallet = await getWalletByUserId(userId);
  const blockchainConnected = await isBlockchainConnected();

  const holdings = await prisma.holding.findMany({
    where: { userId },
    include: { stock: true },
    orderBy: { stock: { symbol: "asc" } },
  });

  const onChainHoldings =
    wallet?.address && blockchainConnected
      ? await getServerOnChainHoldingsBySymbol(wallet.address)
      : null;

  const onChainVirtualCash =
    wallet?.address && blockchainConnected
      ? await getServerVirtualCashInr(wallet.address)
      : null;

  let blockchainStaleWarning = false;
  const holdingRows: HoldingRow[] = [];
  const metricsList = [];

  for (const holding of holdings) {
    const quantity = Number(holding.quantity.toString());
    const averageBuyPrice = decimalToNumber(holding.averageBuyPrice);
    const currentPrice = decimalToNumber(holding.stock.currentPrice);
    const metrics = computeHoldingMetrics(
      quantity,
      averageBuyPrice,
      currentPrice,
    );

    metricsList.push(metrics);

    const symbol = holding.stock.symbol.toUpperCase();
    const onChainQuantity = onChainHoldings?.get(symbol) ?? null;
    const onChainMismatch =
      onChainHoldings !== null &&
      onChainQuantity !== null &&
      !quantitiesMatch(holding.quantity.toString(), onChainQuantity);

    if (onChainHoldings !== null) {
      const hasOnChain = onChainHoldings.has(symbol);

      if (!hasOnChain || onChainMismatch) {
        blockchainStaleWarning = true;
      }
    }

    holdingRows.push({
      stockId: holding.stockId,
      symbol: holding.stock.symbol,
      companyName: holding.stock.companyName,
      quantity: holding.quantity.toString(),
      averageBuyPrice,
      currentPrice,
      marketValue: metrics.marketValue,
      costBasis: metrics.costBasis,
      unrealizedPnL: metrics.unrealizedPnL,
      pnlPercent: metrics.pnlPercent,
      allocationPercent: null,
      onChainQuantity,
      onChainMismatch,
    });
  }

  const totals = aggregatePortfolioMetrics(metricsList);

  for (const row of holdingRows) {
    row.allocationPercent = computeAllocationPercent(
      row.marketValue,
      totals.totalMarketValue,
    );
  }

  const totalPortfolioValue =
    totals.totalMarketValue + (onChainVirtualCash ?? 0);

  return {
    summary: {
      totalMarketValue: totals.totalMarketValue,
      totalCostBasis: totals.totalCostBasis,
      totalUnrealizedPnL: totals.totalUnrealizedPnL,
      totalPortfolioValue,
      holdingsCount: holdingRows.length,
      onChainVirtualCash,
      onChainVirtualCashLabel:
        onChainVirtualCash !== null ? "On-chain Virtual Cash" : null,
      blockchainConnected,
      walletMissing: !wallet,
      blockchainStaleWarning,
    },
    holdings: holdingRows,
  };
}

export async function getHoldingsForUser(userId: string): Promise<HoldingRow[]> {
  const portfolio = await getPortfolioForUser(userId);
  return portfolio.holdings;
}
