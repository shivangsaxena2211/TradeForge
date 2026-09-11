import "dotenv/config";

import { execSync } from "node:child_process";

async function main() {
  execSync("npx tsx scripts/seed-stock-universe.ts", {
    stdio: "inherit",
    env: process.env,
  });
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
