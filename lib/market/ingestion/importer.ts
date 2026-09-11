import { getPrismaClient } from "@/lib/db/client";

import { normalizeHistoricalRow } from "./normalizer";
import { parseHistoricalCsv } from "./parser";
import type { ImportOptions, ImportResult } from "./types";
import { validateHistoricalRow } from "./validators";

export async function importHistoricalCsv(
  content: string,
  options: ImportOptions = {},
): Promise<ImportResult> {
  const rows = parseHistoricalCsv(content);
  const prisma = getPrismaClient();
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;
  const seen = new Set<string>();

  for (let index = 0; index < rows.length; index += 1) {
    const normalized = normalizeHistoricalRow(rows[index]);
    const rowErrors = validateHistoricalRow(normalized, index + 2);

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      skipped += 1;
      continue;
    }

    const dedupeKey = `${normalized.exchange}:${normalized.symbol}:${normalized.date}`;

    if (seen.has(dedupeKey)) {
      errors.push(`Line ${index + 2}: duplicate record for ${dedupeKey}.`);
      skipped += 1;
      continue;
    }

    seen.add(dedupeKey);

    const stock = await prisma.stock.findUnique({
      where: {
        exchange_symbol: {
          exchange: normalized.exchange,
          symbol: normalized.symbol,
        },
      },
    });

    if (!stock) {
      errors.push(
        `Line ${index + 2}: unknown stock ${normalized.exchange}:${normalized.symbol}.`,
      );
      skipped += 1;
      continue;
    }

    if (options.dryRun) {
      imported += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.priceHistory.upsert({
        where: {
          stockId_timestamp_sourceType: {
            stockId: stock.id,
            timestamp: new Date(normalized.date),
            sourceType: "HISTORICAL",
          },
        },
        create: {
          stockId: stock.id,
          price: normalized.close.toFixed(2),
          open: normalized.open.toFixed(2),
          high: normalized.high.toFixed(2),
          low: normalized.low.toFixed(2),
          close: normalized.close.toFixed(2),
          volume: BigInt(normalized.volume),
          sourceType: "HISTORICAL",
          timestamp: new Date(normalized.date),
        },
        update: {
          price: normalized.close.toFixed(2),
          open: normalized.open.toFixed(2),
          high: normalized.high.toFixed(2),
          low: normalized.low.toFixed(2),
          close: normalized.close.toFixed(2),
          volume: BigInt(normalized.volume),
        },
      });

      await tx.stock.update({
        where: { id: stock.id },
        data: {
          currentPrice: normalized.close.toFixed(2),
          previousClose: normalized.open.toFixed(2),
          dayOpen: normalized.open.toFixed(2),
          dayHigh: normalized.high.toFixed(2),
          dayLow: normalized.low.toFixed(2),
          volume: BigInt(normalized.volume),
          priceSource: "HISTORICAL_IMPORT",
          lastMarketUpdateAt: new Date(normalized.date),
        },
      });
    });

    imported += 1;
  }

  return { imported, skipped, errors };
}
