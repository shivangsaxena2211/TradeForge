export type HistoricalCsvRow = {
  date: string;
  symbol: string;
  exchange: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export type ImportOptions = {
  dryRun?: boolean;
};
