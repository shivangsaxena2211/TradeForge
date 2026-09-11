export type TradeSide = "BUY" | "SELL";

export type ParsedTradeExecutedEvent = {
  tradeId: bigint;
  user: string;
  stockId: bigint;
  side: TradeSide;
  quantity: bigint;
  executionPrice: bigint;
  totalValue: bigint;
  timestamp: bigint;
};

export type OnChainStockQuote = {
  stockId: number;
  symbol: string;
  name: string;
  pricePaise: bigint;
  priceInr: string;
  active: boolean;
};

export type CreateOrderResult =
  | {
      success: true;
      orderId: string;
      onChainStockId: number;
      requestedPriceInr: string;
    }
  | { success: false; error: string };

export type OrderListItem = {
  id: string;
  symbol: string;
  companyName: string;
  side: string;
  orderType: string;
  quantity: string;
  status: string;
  requestedPrice: number;
  executedPrice: number | null;
  totalValue: number | null;
  createdAt: Date;
  txHash: string | null;
  blockNumber: string | null;
};

export type OrderDetail = OrderListItem & {
  trade: {
    id: string;
    quantity: string;
    price: number;
    totalValue: number;
    executedAt: Date;
  } | null;
  transactions: Array<{
    id: string;
    status: string;
    transactionType: string;
    txHash: string | null;
    blockNumber: string | null;
    confirmedAt: Date | null;
  }>;
};

export type SyncOrderResult =
  | {
      success: true;
      orderId: string;
      tradeId: string;
      transactionId: string;
      txHash: string;
      blockNumber: number;
      alreadySynced: boolean;
    }
  | { success: false; error: string; blockchainSucceeded?: boolean };
