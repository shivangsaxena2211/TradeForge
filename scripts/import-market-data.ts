import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { importHistoricalCsv } from "../lib/market/ingestion/importer";

async function main() {
  const filePath = resolve(process.argv[2] ?? "fixtures/market-data-sample.csv");
  const dryRun = process.argv.includes("--dry-run");
  const content = readFileSync(filePath, "utf8");

  const result = await importHistoricalCsv(content, { dryRun });

  console.log(`Imported: ${result.imported}`);
  console.log(`Skipped: ${result.skipped}`);

  if (result.errors.length > 0) {
    console.log("Errors:");
    for (const error of result.errors.slice(0, 20)) {
      console.log(`  - ${error}`);
    }

    if (result.errors.length > 20) {
      console.log(`  ... and ${result.errors.length - 20} more`);
    }
  }

  if (result.errors.length > 0 && result.imported === 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
