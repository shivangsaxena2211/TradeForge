import { roundCurrency } from "@/lib/market/calculations";

import type { HistoricalCsvRow } from "./types";

export function normalizeHistoricalRow(row: HistoricalCsvRow): HistoricalCsvRow {
  return {
    date: new Date(row.date).toISOString(),
    symbol: row.symbol.trim().toUpperCase(),
    exchange: row.exchange.trim().toUpperCase(),
    open: roundCurrency(row.open),
    high: roundCurrency(row.high),
    low: roundCurrency(row.low),
    close: roundCurrency(row.close),
    volume: Math.max(0, Math.round(row.volume)),
  };
}
