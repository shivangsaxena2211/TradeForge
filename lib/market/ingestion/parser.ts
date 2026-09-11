import type { HistoricalCsvRow } from "./types";

const EXPECTED_HEADERS = [
  "date",
  "symbol",
  "exchange",
  "open",
  "high",
  "low",
  "close",
  "volume",
];

export function parseHistoricalCsv(content: string): HistoricalCsvRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());

  for (const expected of EXPECTED_HEADERS) {
    if (!headers.includes(expected)) {
      throw new Error(`Missing required CSV column: ${expected}`);
    }
  }

  const rows: HistoricalCsvRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = lines[index].split(",").map((value) => value.trim());
    const record: Record<string, string> = {};

    headers.forEach((header, headerIndex) => {
      record[header] = values[headerIndex] ?? "";
    });

    rows.push({
      date: record.date,
      symbol: record.symbol.toUpperCase(),
      exchange: record.exchange.toUpperCase(),
      open: Number(record.open),
      high: Number(record.high),
      low: Number(record.low),
      close: Number(record.close),
      volume: Number(record.volume),
    });
  }

  return rows;
}
