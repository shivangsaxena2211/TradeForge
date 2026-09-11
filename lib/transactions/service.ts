import "server-only";

import type {
  TransactionStatus,
  TransactionType,
} from "@/lib/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/client";
import { verifyTransactionOnChain } from "@/lib/blockchain/server-transaction";
import { getWalletByUserId } from "@/lib/wallet/repository";

import { mapTransactionListItem } from "./mappers";
import type {
  TransactionDetail,
  TransactionFilters,
  TransactionListResult,
  TransactionSummary,
} from "./types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function normalizePageSize(pageSize?: number): number {
  if (!pageSize || pageSize < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(pageSize, MAX_PAGE_SIZE);
}

function normalizePage(page?: number): number {
  if (!page || page < 1) {
    return 1;
  }

  return page;
}

function buildWhereClause(
  userId: string,
  filters: TransactionFilters,
): {
  userId: string;
  status?: TransactionStatus;
  transactionType?: TransactionType;
  OR?: Array<{
    txHash?: { contains: string; mode: "insensitive" };
    order?: {
      stock?: {
        symbol?: { contains: string; mode: "insensitive" };
      };
    };
  }>;
} {
  const where: {
    userId: string;
    status?: TransactionStatus;
    transactionType?: TransactionType;
    OR?: Array<{
      txHash?: { contains: string; mode: "insensitive" };
      order?: {
        stock?: {
          symbol?: { contains: string; mode: "insensitive" };
        };
      };
    }>;
  } = { userId };

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters.type && filters.type !== "ALL") {
    where.transactionType = filters.type;
  }

  const search = filters.search?.trim();

  if (search) {
    where.OR = [
      { txHash: { contains: search, mode: "insensitive" } },
      {
        order: {
          stock: {
            symbol: { contains: search.toUpperCase(), mode: "insensitive" },
          },
        },
      },
    ];
  }

  return where;
}

export async function getTransactionSummaryForUser(
  userId: string,
): Promise<TransactionSummary> {
  const prisma = getPrismaClient();

  const [totalTransactions, confirmedCount, buyCount, sellCount] =
    await Promise.all([
      prisma.transaction.count({ where: { userId } }),
      prisma.transaction.count({
        where: { userId, status: "CONFIRMED" },
      }),
      prisma.transaction.count({
        where: { userId, transactionType: "STOCK_BUY" },
      }),
      prisma.transaction.count({
        where: { userId, transactionType: "STOCK_SELL" },
      }),
    ]);

  return {
    totalTransactions,
    confirmedCount,
    buyCount,
    sellCount,
  };
}

export async function getTransactionsForUser(
  userId: string,
  filters: TransactionFilters = {},
) {
  const prisma = getPrismaClient();
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const where = buildWhereClause(userId, filters);

  const [totalCount, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: {
        order: {
          include: {
            stock: true,
            trade: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    transactions,
    totalCount,
    page,
    pageSize,
  };
}

export async function getTransactionListForUser(
  userId: string,
  filters: TransactionFilters = {},
): Promise<TransactionListResult> {
  const [summary, result] = await Promise.all([
    getTransactionSummaryForUser(userId),
    getTransactionsForUser(userId, filters),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize));

  return {
    transactions: result.transactions.map(mapTransactionListItem),
    summary,
    page: result.page,
    pageSize: result.pageSize,
    totalCount: result.totalCount,
    totalPages,
  };
}

export async function getTransactionDetailForUser(
  userId: string,
  transactionId: string,
): Promise<TransactionDetail | null> {
  const prisma = getPrismaClient();

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    include: {
      order: {
        include: {
          stock: true,
          trade: true,
        },
      },
    },
  });

  if (!transaction) {
    return null;
  }

  const wallet = await getWalletByUserId(userId);
  const base = mapTransactionListItem(transaction);

  let blockchain = {
    blockchainConnected: false,
    foundOnChain: false,
    historicalOnly: false,
    from: null as string | null,
    to: null as string | null,
    blockNumber: null as number | null,
    chainId: 31337,
    blockTimestamp: null as number | null,
    receiptStatus: null as "success" | "reverted" | "unknown" | null,
    message: "Blockchain currently unavailable." as string | null,
  };

  if (transaction.txHash) {
    const verification = await verifyTransactionOnChain(transaction.txHash);
    blockchain = verification;
  } else {
    blockchain.message = "No blockchain transaction hash recorded.";
  }

  return {
    ...base,
    updatedAt: (transaction.confirmedAt ?? transaction.createdAt).toISOString(),
    walletAddress: wallet?.address ?? null,
    blockchain,
  };
}
