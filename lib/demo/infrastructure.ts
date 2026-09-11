import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { JsonRpcProvider } from "ethers";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

import { ANVIL_RPC_URL, EXPECTED_CHAIN_ID } from "./constants";

const execFileAsync = promisify(execFile);

export async function checkPostgresConnection(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query("SELECT 1");
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function runPrismaGenerate(): Promise<void> {
  await execFileAsync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "db:generate"],
    { cwd: process.cwd(), env: process.env },
  );
}

export async function runPendingMigrationsIfNeeded(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["prisma", "migrate", "status"],
      { cwd: process.cwd(), env: process.env },
    );

    const output = stdout.toString();

    if (
      output.includes("Database schema is up to date") ||
      output.includes("No pending migrations")
    ) {
      return false;
    }

    if (output.includes("Following migration have not yet been applied")) {
      await execFileAsync(
        process.platform === "win32" ? "npx.cmd" : "npx",
        ["prisma", "migrate", "deploy"],
        { cwd: process.cwd(), env: process.env },
      );
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function waitForAnvilRpc(
  timeoutMs = 30_000,
): Promise<{ chainId: number }> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const provider = new JsonRpcProvider(ANVIL_RPC_URL, undefined, {
        staticNetwork: true,
      });
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      if (chainId !== EXPECTED_CHAIN_ID) {
        throw new Error(
          `Anvil on ${ANVIL_RPC_URL} reports chain ID ${chainId}. Expected ${EXPECTED_CHAIN_ID}.`,
        );
      }

      await provider.getBlockNumber();
      return { chainId };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Expected")
      ) {
        throw error;
      }

      await sleep(500);
    }
  }

  throw new Error(`Timed out waiting for Anvil RPC at ${ANVIL_RPC_URL}.`);
}

export async function isAnvilRunning(): Promise<boolean> {
  try {
    await waitForAnvilRpc(2_000);
    return true;
  } catch {
    return false;
  }
}

export function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
