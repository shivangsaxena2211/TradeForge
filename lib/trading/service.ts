import "server-only";

import { Contract } from "ethers";

import type { OrderSide, OrderStatus } from "@/lib/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/client";
import {
  localContractAddresses,
  stockContractAbi,
} from "@/lib/blockchain/contracts";
import { getBlockchainProvider } from "@/lib/blockchain/provider";
import { findStockBySymbolOrFirst } from "@/lib/market/repository";
import { getCurrentSimulatedPriceInr } from "@/lib/market/service";
import { syncOnChainStockPrice } from "@/lib/blockchain/sync-stock-prices";
import { getWalletByUserId } from "@/lib/wallet/repository";

import { parseTradeExecutedFromReceipt } from "./events";
import {
  paiseToInrString,
  unitsToShareDecimal,
} from "./precision";
import type {
  CreateOrderResult,
  OrderDetail,
  OrderListItem,
  SyncOrderResult,
  TradeSide,
} from "./types";

async function getStockRecord(symbol: string) {
  return findStockBySymbolOrFirst(symbol);
}

export async function createPendingOrder(
  userId: string,
  symbol: string,
  side: TradeSide,
  quantityUnits: bigint,
  onChainStockId: number,
  requestedPricePaise: bigint,
): Promise<CreateOrderResult> {
  const stock = await getStockRecord(symbol);

  if (!stock) {
    return { success: false, error: "Stock not found." };
  }

  if (!stock.isActive) {
    return { success: false, error: "Stock is inactive and cannot be traded." };
  }

  if (!stock.simulationEnabled) {
    return {
      success: false,
      error: "Stock is not enabled for simulated trading.",
    };
  }

  if (stock.onChainStockId === null) {
    return {
      success: false,
      error: "Blockchain trading is not configured for this stock.",
    };
  }

  if (onChainStockId !== stock.onChainStockId) {
    return {
      success: false,
      error: "On-chain stock mapping mismatch for this symbol.",
    };
  }

  const wallet = await getWalletByUserId(userId);

  if (!wallet) {
    return { success: false, error: "DEFINN wallet is not registered." };
  }

  const simulatedPrice = await getCurrentSimulatedPriceInr(symbol);

  if (simulatedPrice === null) {
    return { success: false, error: "Simulated market price unavailable." };
  }

  const syncResult = await syncOnChainStockPrice(
    stock.onChainStockId,
    simulatedPrice,
  );

  if (!syncResult.success) {
    return {
      success: false,
      error: syncResult.error ?? "Unable to synchronize on-chain execution price.",
    };
  }

  const prisma = getPrismaClient();
  const order = await prisma.order.create({
    data: {
      userId,
      stockId: stock.id,
      side: side as OrderSide,
      orderType: "MARKET",
      quantity: unitsToShareDecimal(quantityUnits),
      requestedPrice: paiseToInrString(requestedPricePaise),
      status: "PENDING",
    },
  });

  return {
    success: true,
    orderId: order.id,
    onChainStockId: stock.onChainStockId,
    requestedPriceInr: paiseToInrString(requestedPricePaise),
  };
}

export async function cancelPendingOrder(
  userId: string,
  orderId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const prisma = getPrismaClient();
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.status !== "PENDING") {
    return { success: false, error: "Only pending orders can be cancelled." };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED" },
  });

  return { success: true };
}

export async function failPendingOrder(
  userId: string,
  orderId: string,
): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.order.updateMany({
    where: { id: orderId, userId, status: "PENDING" },
    data: { status: "FAILED" },
  });
}

export async function syncOrderFromTransaction(
  userId: string,
  orderId: string,
  txHash: string,
): Promise<SyncOrderResult> {
  const prisma = getPrismaClient();

  const existingTransaction = await prisma.transaction.findUnique({
    where: { txHash },
    include: { order: true },
  });

  if (existingTransaction) {
    if (existingTransaction.userId !== userId) {
      return { success: false, error: "Transaction already recorded." };
    }

    const trade = await prisma.trade.findUnique({
      where: { orderId: existingTransaction.orderId ?? orderId },
    });

    return {
      success: true,
      orderId: existingTransaction.orderId ?? orderId,
      tradeId: trade?.id ?? "",
      transactionId: existingTransaction.id,
      txHash,
      blockNumber: existingTransaction.blockNumber
        ? Number(existingTransaction.blockNumber)
        : 0,
      alreadySynced: true,
    };
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { stock: true },
  });

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.status === "EXECUTED") {
    const trade = await prisma.trade.findUnique({ where: { orderId: order.id } });
    const transaction = await prisma.transaction.findFirst({
      where: { orderId: order.id },
    });

    return {
      success: true,
      orderId: order.id,
      tradeId: trade?.id ?? "",
      transactionId: transaction?.id ?? "",
      txHash: transaction?.txHash ?? txHash,
      blockNumber: transaction?.blockNumber
        ? Number(transaction.blockNumber)
        : 0,
      alreadySynced: true,
    };
  }

  const wallet = await getWalletByUserId(userId);

  if (!wallet) {
    return { success: false, error: "DEFINN wallet is not registered." };
  }

  let receipt;

  try {
    const provider = getBlockchainProvider();
    receipt = await provider.getTransactionReceipt(txHash);
  } catch (error) {
    console.error("Failed to fetch transaction receipt:", error);
    return { success: false, error: "Unable to verify blockchain transaction." };
  }

  if (!receipt) {
    return { success: false, error: "Transaction receipt not found." };
  }

  if (receipt.status === 0) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });

    return { success: false, error: "Transaction reverted by the smart contract." };
  }

  const tradeEvent = parseTradeExecutedFromReceipt(receipt);

  if (!tradeEvent) {
    return {
      success: false,
      error: "Trade event not found in transaction receipt.",
      blockchainSucceeded: true,
    };
  }

  if (tradeEvent.user.toLowerCase() !== wallet.address.toLowerCase()) {
    return {
      success: false,
      error: "Transaction wallet does not match the registered DEFINN wallet.",
      blockchainSucceeded: true,
    };
  }

  const executionPriceInr = paiseToInrString(tradeEvent.executionPrice);
  const totalValueInr = paiseToInrString(tradeEvent.totalValue);
  const quantityDecimal = unitsToShareDecimal(tradeEvent.quantity);
  const transactionType =
    tradeEvent.side === "BUY" ? "STOCK_BUY" : "STOCK_SELL";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "EXECUTED",
          executedPrice: executionPriceInr,
        },
      });

      const trade = await tx.trade.create({
        data: {
          orderId: updatedOrder.id,
          userId,
          stockId: order.stockId,
          side: tradeEvent.side,
          quantity: quantityDecimal,
          price: executionPriceInr,
          totalValue: totalValueInr,
          executedAt: new Date(Number(tradeEvent.timestamp) * 1000),
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          orderId: updatedOrder.id,
          transactionType,
          status: "CONFIRMED",
          txHash,
          blockNumber: BigInt(receipt.blockNumber),
          confirmedAt: new Date(),
        },
      });

      const provider = getBlockchainProvider();
      const contract = new Contract(
        localContractAddresses.stock,
        stockContractAbi,
        provider,
      );

      const onChainHolding = await contract.getHolding(
        wallet.address,
        tradeEvent.stockId,
      );
      const holdingQuantity = unitsToShareDecimal(BigInt(onChainHolding.toString()));

      const existingHolding = await tx.holding.findUnique({
        where: {
          userId_stockId: {
            userId,
            stockId: order.stockId,
          },
        },
      });

      if (BigInt(onChainHolding.toString()) === BigInt(0)) {
        if (existingHolding) {
          await tx.holding.delete({
            where: { id: existingHolding.id },
          });
        }
      } else if (existingHolding) {
        let averageBuyPrice = existingHolding.averageBuyPrice.toString();

        if (tradeEvent.side === "BUY") {
          const oldQuantity = Number(existingHolding.quantity.toString());
          const boughtQuantity = Number(quantityDecimal);
          const newQuantity = Number(holdingQuantity);
          const oldAverage = Number(existingHolding.averageBuyPrice.toString());
          const execution = Number(executionPriceInr);

          averageBuyPrice = (
            (oldQuantity * oldAverage + boughtQuantity * execution) /
            newQuantity
          ).toFixed(2);
        }

        await tx.holding.update({
          where: { id: existingHolding.id },
          data: {
            quantity: holdingQuantity,
            averageBuyPrice,
          },
        });
      } else {
        await tx.holding.create({
          data: {
            userId,
            stockId: order.stockId,
            quantity: holdingQuantity,
            averageBuyPrice: executionPriceInr,
          },
        });
      }

      return { trade, transaction };
    });

    return {
      success: true,
      orderId: order.id,
      tradeId: result.trade.id,
      transactionId: result.transaction.id,
      txHash,
      blockNumber: receipt.blockNumber,
      alreadySynced: false,
    };
  } catch (error) {
    console.error("PostgreSQL sync failed after blockchain success:", error);

    return {
      success: false,
      error:
        "Blockchain trade succeeded, but application synchronization failed. Please retry sync with the same transaction hash.",
      blockchainSucceeded: true,
    };
  }
}

export async function getRecentTradesForUser(userId: string, limit = 5) {
  const prisma = getPrismaClient();

  return prisma.trade.findMany({
    where: { userId },
    include: {
      stock: true,
      order: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { executedAt: "desc" },
    take: limit,
  });
}

function mapOrderListItem(
  order: Awaited<ReturnType<typeof getOrdersForUser>>[number],
): OrderListItem {
  const transaction = order.transactions[0] ?? null;

  return {
    id: order.id,
    symbol: order.stock.symbol,
    companyName: order.stock.companyName,
    side: order.side,
    orderType: order.orderType,
    quantity: order.quantity.toString(),
    status: order.status,
    requestedPrice: Number(order.requestedPrice.toString()),
    executedPrice: order.executedPrice
      ? Number(order.executedPrice.toString())
      : null,
    totalValue: order.trade ? Number(order.trade.totalValue.toString()) : null,
    createdAt: order.createdAt,
    txHash: transaction?.txHash ?? null,
    blockNumber: transaction?.blockNumber?.toString() ?? null,
  };
}

export async function getOrdersForUser(
  userId: string,
  status?: OrderStatus | "ALL",
) {
  const prisma = getPrismaClient();

  return prisma.order.findMany({
    where: {
      userId,
      ...(status && status !== "ALL" ? { status } : {}),
    },
    include: {
      stock: true,
      trade: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderListForUser(
  userId: string,
  status?: OrderStatus | "ALL",
): Promise<OrderListItem[]> {
  const orders = await getOrdersForUser(userId, status);
  return orders.map(mapOrderListItem);
}

export async function getOrderDetailForUser(
  userId: string,
  orderId: string,
): Promise<OrderDetail | null> {
  const prisma = getPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      stock: true,
      trade: true,
      transactions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return null;
  }

  const base = mapOrderListItem(order);

  return {
    ...base,
    trade: order.trade
      ? {
          id: order.trade.id,
          quantity: order.trade.quantity.toString(),
          price: Number(order.trade.price.toString()),
          totalValue: Number(order.trade.totalValue.toString()),
          executedAt: order.trade.executedAt,
        }
      : null,
    transactions: order.transactions.map((transaction) => ({
      id: transaction.id,
      status: transaction.status,
      transactionType: transaction.transactionType,
      txHash: transaction.txHash,
      blockNumber: transaction.blockNumber?.toString() ?? null,
      confirmedAt: transaction.confirmedAt,
    })),
  };
}
