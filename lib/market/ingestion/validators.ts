import type { HistoricalCsvRow } from "./types";

export function validateHistoricalRow(
  row: HistoricalCsvRow,
  lineNumber: number,
): string[] {
  const errors: string[] = [];

  if (!row.date || Number.isNaN(Date.parse(row.date))) {
    errors.push(`Line ${lineNumber}: invalid date "${row.date}".`);
  }

  if (!row.symbol?.trim()) {
    errors.push(`Line ${lineNumber}: symbol is required.`);
  }

  if (!["NSE", "BSE"].includes(row.exchange?.trim().toUpperCase())) {
    errors.push(`Line ${lineNumber}: exchange must be NSE or BSE.`);
  }

  for (const field of ["open", "high", "low", "close"] as const) {
    if (!Number.isFinite(row[field]) || row[field] <= 0) {
      errors.push(`Line ${lineNumber}: ${field} must be a positive number.`);
    }
  }

  if (!Number.isFinite(row.volume) || row.volume < 0) {
    errors.push(`Line ${lineNumber}: volume must be non-negative.`);
  }

  const maxOc = Math.max(row.open, row.close);
  const minOc = Math.min(row.open, row.close);

  if (row.high < maxOc) {
    errors.push(`Line ${lineNumber}: high must be >= max(open, close).`);
  }

  if (row.low > minOc) {
    errors.push(`Line ${lineNumber}: low must be <= min(open, close).`);
  }

  return errors;
}
