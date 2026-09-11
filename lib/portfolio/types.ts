export type HoldingRow = {
  stockId: string;
  symbol: string;
  companyName: string;
  quantity: string;
  averageBuyPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  pnlPercent: number | null;
  allocationPercent: number | null;
  onChainQuantity: string | null;
  onChainMismatch: boolean;
};

export type PortfolioSummary = {
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalPortfolioValue: number;
  holdingsCount: number;
  onChainVirtualCash: number | null;
  onChainVirtualCashLabel: string | null;
  blockchainConnected: boolean;
  walletMissing: boolean;
  blockchainStaleWarning: boolean;
};

export type PortfolioSnapshot = {
  summary: PortfolioSummary;
  holdings: HoldingRow[];
};
