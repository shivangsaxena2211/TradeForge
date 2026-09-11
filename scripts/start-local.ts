import { spawn } from "node:child_process";
import { config as loadEnv } from "dotenv";

loadEnv();
loadEnv({ path: ".env.local", override: true });

import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { PrismaPg } from "@prisma/adapter-pg";

import { getAnvilAdminPrivateKey } from "../lib/blockchain/admin-key";
import {
  localContractAddresses,
  stockContractAbi,
} from "../lib/blockchain/contracts";
import { areLocalContractsDeployed } from "../lib/blockchain/contract-deployment";
import {
  clearOnChainStockMappings,
  runOnChainStockSetup,
  runOnChainStockVerification,
} from "../lib/blockchain/run-on-chain-stock-setup";
import { DEMO_WALLET_ADDRESS } from "../lib/demo/constants";
import {
  formatInrBalanceFromPaise,
  fundDemoAccount,
} from "../lib/demo/fund-wallet";
import {
  ANVIL_RPC_URL,
  EXPECTED_CHAIN_ID,
} from "../lib/demo/constants";
import {
  checkPostgresConnection,
  isAnvilRunning,
  runPendingMigrationsIfNeeded,
  runPrismaGenerate,
  waitForAnvilRpc,
} from "../lib/demo/infrastructure";
import { PrismaClient } from "../lib/generated/prisma/client";

type StepStatus = "ok" | "warn" | "fail";

function logStep(
  step: number,
  total: number,
  label: string,
  status: StepStatus,
  detail: string,
) {
  const icon = status === "ok" ? "✓" : status === "warn" ? "!" : "✗";
  console.log(`[${step}/${total}] ${label.padEnd(18)} ${icon} ${detail}`);
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`,
          ),
        );
      }
    });
  });
}

async function npmRun(script: string): Promise<void> {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  await runCommand(npm, ["run", script]);
}

async function startAnvil(): Promise<void> {
  const child = spawn(
    "anvil",
    ["--host", "127.0.0.1", "--port", "8545", "--chain-id", String(EXPECTED_CHAIN_ID)],
    {
      cwd: process.cwd(),
      stdio: "ignore",
      env: process.env,
      detached: true,
    },
  );

  child.unref();
}

async function verifyStockMappings(prisma: PrismaClient) {
  const provider = new JsonRpcProvider(ANVIL_RPC_URL, EXPECTED_CHAIN_ID, {
    staticNetwork: true,
  });
  const admin = new Wallet(getAnvilAdminPrivateKey(), provider);
  const stock = new Contract(
    localContractAddresses.stock,
    stockContractAbi,
    admin,
  );

  const result = await runOnChainStockVerification(prisma, stock);

  if (result.failed > 0) {
    const failures = result.rows
      .filter((row) => row.status === "FAIL")
      .map((row) => `${row.symbol} (${row.detail})`)
      .join("\n  - ");

    throw new Error(
      `Stock verification failed (${result.failed}):\n  - ${failures}`,
    );
  }

  return result;
}

async function setupStockMappings(prisma: PrismaClient): Promise<number> {
  const provider = new JsonRpcProvider(ANVIL_RPC_URL, EXPECTED_CHAIN_ID, {
    staticNetwork: true,
  });
  const admin = new Wallet(getAnvilAdminPrivateKey(), provider);
  const stock = new Contract(
    localContractAddresses.stock,
    stockContractAbi,
    admin,
  );

  const result = await runOnChainStockSetup(prisma, stock);

  if (result.errors.length > 0) {
    throw new Error(result.errors.join("\n"));
  }

  return result.rows.filter((row) => row.action !== "deactivated").length;
}

function printReadyBanner(options: {
  ethBalance: string;
  virtualCashLabel: string;
  virtualCashStatus: StepStatus;
  mappedStocks: number;
  verifiedStocks: number;
}) {
  console.log("\n========================================");
  console.log("   Blockchain environment ready");
  console.log("========================================");
  console.log(`Wallet:\n${DEMO_WALLET_ADDRESS}`);
  console.log(`Network:\nAnvil / Chain ${EXPECTED_CHAIN_ID}`);
  console.log(`Demo ETH:\n${options.ethBalance} ETH`);
  console.log(`Virtual Cash:\n${options.virtualCashLabel}`);
  console.log(
    `Stocks:\n${options.verifiedStocks}/${options.mappedStocks} NSE equities verified`,
  );
  console.log("========================================\n");
  console.log("Start the application separately:\n  npm run dev\n");
}

async function main() {
  const totalSteps = 7;
  let mappedStocks = 0;
  let verifiedStocks = 0;
  let ethBalance = "0";
  let virtualCashLabel = "Waiting for wallet registration";
  let virtualCashStatus: StepStatus = "warn";

  console.log("========================================");
  console.log("   DEFINN BLOCKCHAIN ENVIRONMENT");
  console.log("========================================\n");

  try {
    getAnvilAdminPrivateKey();
  } catch (error) {
    logStep(
      1,
      totalSteps,
      "Configuration",
      "fail",
      error instanceof Error ? error.message : "Missing ANVIL_ADMIN_PRIVATE_KEY",
    );
    process.exit(1);
  }

  try {
    await checkPostgresConnection();
    logStep(1, totalSteps, "PostgreSQL", "ok", "Connected");
  } catch (error) {
    logStep(
      1,
      totalSteps,
      "PostgreSQL",
      "fail",
      error instanceof Error ? error.message : "Unavailable",
    );
    process.exit(1);
  }

  await runPrismaGenerate().catch(() => undefined);
  await runPendingMigrationsIfNeeded().catch(() => undefined);

  const alreadyRunning = await isAnvilRunning();

  if (alreadyRunning) {
    logStep(2, totalSteps, "Anvil", "ok", "Already running on port 8545");
  } else {
    await startAnvil();
    await waitForAnvilRpc();
    logStep(2, totalSteps, "Anvil", "ok", `Started on chain ${EXPECTED_CHAIN_ID}`);
  }

  await npmRun("blockchain:build");

  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const deployProvider = new JsonRpcProvider(ANVIL_RPC_URL, EXPECTED_CHAIN_ID, {
    staticNetwork: true,
  });
  const contractsAlreadyDeployed = await areLocalContractsDeployed(
    deployProvider,
    localContractAddresses,
  );

  let freshDeployment = false;

  if (contractsAlreadyDeployed) {
    logStep(
      3,
      totalSteps,
      "Contracts",
      "ok",
      `Built · reusing deployment (${localContractAddresses.stock.slice(0, 10)}…)`,
    );
  } else {
    await npmRun("blockchain:deploy");
    freshDeployment = true;
    logStep(3, totalSteps, "Contracts", "ok", "Built & deployed");
  }

  try {
    if (freshDeployment) {
      const cleared = await clearOnChainStockMappings(prisma);
      console.log(
        `Cleared ${cleared} stale onChainStockId mappings after fresh contract deployment.`,
      );
    }

    mappedStocks = await setupStockMappings(prisma);
    logStep(4, totalSteps, "Stocks", "ok", `${mappedStocks} mapped by exchange:symbol`);

    const verification = await verifyStockMappings(prisma);
    verifiedStocks = verification.passed;
    logStep(
      5,
      totalSteps,
      "Verification",
      "ok",
      `${verifiedStocks}/${verifiedStocks} PASS`,
    );

    const fundResult = await fundDemoAccount();
    ethBalance = fundResult.eth.balanceEth;
    logStep(6, totalSteps, "Demo ETH", "ok", `${ethBalance} ETH`);

    if (!fundResult.virtualCash.registered) {
      virtualCashStatus = "warn";
      virtualCashLabel = "Waiting for wallet registration";
      logStep(7, totalSteps, "Virtual Cash", "warn", "Waiting for wallet registration");
      console.log(
        "\nDemo wallet is not registered on the current Anvil chain.\nUnlock the wallet in the app and click Register on Blockchain, then run:\n  npm run demo:fund\n",
      );
    } else {
      virtualCashStatus = "ok";
      virtualCashLabel = formatInrBalanceFromPaise(fundResult.virtualCash.balancePaise);
      logStep(7, totalSteps, "Virtual Cash", "ok", virtualCashLabel);
    }
  } finally {
    await prisma.$disconnect();
  }

  printReadyBanner({
    ethBalance,
    virtualCashLabel,
    virtualCashStatus,
    mappedStocks,
    verifiedStocks,
  });

  if (virtualCashStatus === "warn") {
    console.log("After wallet registration, credit virtual cash with:\n  npm run demo:fund\n");
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
