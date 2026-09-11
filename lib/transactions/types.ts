export type TransactionFilterStatus = "ALL" | "CONFIRMED" | "FAILED" | "PENDING";

export type TransactionFilterType = "ALL" | "STOCK_BUY" | "STOCK_SELL";

export type TransactionFilters = {
  status?: TransactionFilterStatus;
  type?: TransactionFilterType;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type TransactionListItem = {
  id: string;
  transactionType: string;
  status: string;
  txHash: string | null;
  blockNumber: string | null;
  createdAt: string;
  confirmedAt: string | null;
  orderId: string | null;
  tradeId: string | null;
  symbol: string | null;
  companyName: string | null;
  side: string | null;
  orderType: string | null;
  quantity: string | null;
  executionPrice: string | null;
  totalValue: string | null;
};

export type TransactionSummary = {
  totalTransactions: number;
  confirmedCount: number;
  buyCount: number;
  sellCount: number;
};

export type OnChainVerification = {
  blockchainConnected: boolean;
  foundOnChain: boolean;
  historicalOnly: boolean;
  from: string | null;
  to: string | null;
  blockNumber: number | null;
  chainId: number;
  blockTimestamp: number | null;
  receiptStatus: "success" | "reverted" | "unknown" | null;
  message: string | null;
};

export type TransactionDetail = TransactionListItem & {
  updatedAt: string;
  walletAddress: string | null;
  blockchain: OnChainVerification;
};

export type TransactionListResult = {
  transactions: TransactionListItem[];
  summary: TransactionSummary;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};
