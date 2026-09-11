import type { Prisma } from "@/lib/generated/prisma/client";

import type { TransactionListItem } from "./types";

export type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: {
    order: {
      include: {
        stock: true;
        trade: true;
      };
    };
  };
}>;

export function mapTransactionListItem(
  transaction: TransactionWithRelations,
): TransactionListItem {
  const order = transaction.order;
  const trade = order?.trade ?? null;

  return {
    id: transaction.id,
    transactionType: transaction.transactionType,
    status: transaction.status,
    txHash: transaction.txHash,
    blockNumber: transaction.blockNumber?.toString() ?? null,
    createdAt: transaction.createdAt.toISOString(),
    confirmedAt: transaction.confirmedAt?.toISOString() ?? null,
    orderId: transaction.orderId,
    tradeId: trade?.id ?? null,
    symbol: order?.stock.symbol ?? null,
    companyName: order?.stock.companyName ?? null,
    side: order?.side ?? null,
    orderType: order?.orderType ?? null,
    quantity: trade?.quantity.toString() ?? order?.quantity.toString() ?? null,
    executionPrice:
      trade?.price.toString() ?? order?.executedPrice?.toString() ?? null,
    totalValue: trade?.totalValue.toString() ?? null,
  };
}
