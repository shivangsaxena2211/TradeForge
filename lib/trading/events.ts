import { Interface, type TransactionReceipt } from "ethers";

import {
  localContractAddresses,
  stockContractAbi,
} from "@/lib/blockchain/contracts";

import type { ParsedTradeExecutedEvent, TradeSide } from "./types";

const stockInterface = new Interface(stockContractAbi);

export function parseTradeExecutedFromReceipt(
  receipt: TransactionReceipt,
): ParsedTradeExecutedEvent | null {
  const stockAddress = localContractAddresses.stock.toLowerCase();

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== stockAddress) {
      continue;
    }

    try {
      const parsed = stockInterface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });

      if (!parsed || parsed.name !== "TradeExecuted") {
        continue;
      }

      const sideValue = Number(parsed.args.side);

      return {
        tradeId: BigInt(parsed.args.tradeId.toString()),
        user: String(parsed.args.user),
        stockId: BigInt(parsed.args.stockId.toString()),
        side: sideValue === 0 ? "BUY" : "SELL",
        quantity: BigInt(parsed.args.quantity.toString()),
        executionPrice: BigInt(parsed.args.executionPrice.toString()),
        totalValue: BigInt(parsed.args.totalValue.toString()),
        timestamp: BigInt(parsed.args.timestamp.toString()),
      };
    } catch {
      continue;
    }
  }

  return null;
}

export function tradeSideToEnum(side: TradeSide): "BUY" | "SELL" {
  return side;
}
