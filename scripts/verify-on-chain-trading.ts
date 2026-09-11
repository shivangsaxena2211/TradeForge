import "dotenv/config";

import { Contract, JsonRpcProvider } from "ethers";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  printVerifyResult,
  runOnChainStockVerification,
} from "../lib/blockchain/run-on-chain-stock-setup";
import {
  localContractAddresses,
  stockContractAbi,
} from "../lib/blockchain/contracts";
import { getClientBlockchainConfig } from "../lib/blockchain/client/config";
import { PrismaClient } from "../lib/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  const config = getClientBlockchainConfig();
  const provider = new JsonRpcProvider(config.rpcUrl, config.chainId, {
    staticNetwork: true,
  });
  const stock = new Contract(
    localContractAddresses.stock,
    stockContractAbi,
    provider,
  );

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await runOnChainStockVerification(prisma, stock);
    printVerifyResult(result);

    const focusSymbols = process.argv.slice(2);

    if (focusSymbols.length > 0) {
      console.log("\nFocused checks:");
      for (const symbol of focusSymbols) {
        const row = result.rows.find(
          (entry) => entry.symbol.toUpperCase() === symbol.toUpperCase(),
        );

        if (!row) {
          console.log(`  ${symbol}: NOT FOUND in active tradeable universe`);
          process.exitCode = 1;
          continue;
        }

        console.log(`  ${row.symbol}: ${row.status} — ${row.detail}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
