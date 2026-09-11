import "dotenv/config";

import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  printSetupResult,
  runOnChainStockSetup,
} from "../lib/blockchain/run-on-chain-stock-setup";
import {
  localContractAddresses,
  stockContractAbi,
} from "../lib/blockchain/contracts";
import { getAnvilAdminPrivateKey } from "../lib/blockchain/admin-key";
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
  const signer = new Wallet(getAnvilAdminPrivateKey(), provider);
  const stock = new Contract(
    localContractAddresses.stock,
    stockContractAbi,
    signer,
  );

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const stockCount = Number(await stock.stockCount());
    console.log(`Stock.sol at ${localContractAddresses.stock}`);
    console.log(`Existing on-chain stock count: ${stockCount}\n`);

    const result = await runOnChainStockSetup(prisma, stock);
    printSetupResult(result);

    if (result.errors.length > 0) {
      throw new Error("On-chain stock setup completed with errors.");
    }

    const walletAddress = process.argv[2];

    if (walletAddress) {
      const creditAmount = BigInt(process.argv[3] ?? "10000000");

      try {
        await stock.creditVirtualCash(walletAddress, creditAmount);
        console.log(
          `\nCredited ${creditAmount.toString()} paise virtual cash to ${walletAddress}`,
        );
      } catch (error) {
        console.log(
          `\nSkipped virtual cash credit for ${walletAddress}. Register the wallet on User.sol first, then rerun:\n  npm run trading:setup-on-chain -- ${walletAddress} ${creditAmount.toString()}`,
        );

        if (error instanceof Error) {
          console.log(`Reason: ${error.message}`);
        }
      }
    } else {
      console.log(
        "\nOptional virtual cash credit:\n  npm run trading:setup-on-chain -- <walletAddress> [paiseAmount]",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
