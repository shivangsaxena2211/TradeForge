/**
 * Static demo data for UI shell development only.
 * Not connected to PostgreSQL, APIs, or live market feeds.
 */

export type DemoStock = {
  symbol: string;
  companyName: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
};

export type OrderStatus =
  | "PENDING"
  | "EXECUTED"
  | "FAILED"
  | "CANCELLED";

export const DEMO_VIRTUAL_BALANCE = 100_000;

export const DEMO_STOCKS: DemoStock[] = [
  {
    symbol: "DEMO1",
    companyName: "Demo Technologies",
    exchange: "NSE",
    price: 250.0,
    change: 4.5,
    changePercent: 1.83,
  },
  {
    symbol: "DEMO2",
    companyName: "Demo Industries",
    exchange: "NSE",
    price: 180.75,
    change: -1.25,
    changePercent: -0.69,
  },
  {
    symbol: "DEMO3",
    companyName: "Demo Energy",
    exchange: "BSE",
    price: 95.25,
    change: 1.25,
    changePercent: 1.33,
  },
];

export const DEMO_MARKET_SUMMARY = {
  label: "Simulated Market",
  activeInstruments: DEMO_STOCKS.length,
  note: "Fictional demo instruments — not live exchange prices.",
};

export const ORDER_FILTER_OPTIONS = [
  "All",
  "Pending",
  "Executed",
  "Failed",
  "Cancelled",
] as const;

export const WALLET_NETWORK_LABEL = "Anvil Local (simulation)";
