import type { ContractRunner } from "ethers";

import { getClientProvider } from "./provider";
import { getStockContract } from "./contracts";
import { formatShareQuantity, formatVirtualCashFromUnits } from "./format";

export type StockSummary = {
  id: number;
  symbol: string;
  name: string;
  price: bigint;
  active: boolean;
};

export type HoldingSummary = {
  stockId: number;
  symbol: string;
  name: string;
  quantity: bigint;
  quantityFormatted: string;
};

export type TradeSummary = {
  tradeId: number;
  user: string;
  stockId: number;
  side: "BUY" | "SELL";
  quantity: bigint;
  quantityFormatted: string;
  executionPrice: bigint;
  totalValue: bigint;
  totalValueFormatted: string;
  timestamp: number;
};

function getRunner(runner?: ContractRunner): ContractRunner {
  return runner ?? getClientProvider();
}

export async function getVirtualCashUnits(
  address: string,
  runner?: ContractRunner,
): Promise<bigint> {
  const contract = getStockContract(getRunner(runner));
  return contract.getVirtualCash(address) as Promise<bigint>;
}

export async function getVirtualCashFormatted(
  address: string,
  runner?: ContractRunner,
): Promise<string> {
  const units = await getVirtualCashUnits(address, runner);
  return formatVirtualCashFromUnits(units);
}

export async function getStock(
  stockId: number,
  runner?: ContractRunner,
): Promise<StockSummary> {
  const contract = getStockContract(getRunner(runner));
  const [id, symbol, name, price, active] = await contract.getStock(stockId);

  return {
    id: Number(id),
    symbol,
    name,
    price,
    active,
  };
}

export async function getStockCount(runner?: ContractRunner): Promise<number> {
  const contract = getStockContract(getRunner(runner));
  return Number(await contract.stockCount());
}

export async function getHoldingUnits(
  address: string,
  stockId: number,
  runner?: ContractRunner,
): Promise<bigint> {
  const contract = getStockContract(getRunner(runner));
  return contract.getHolding(address, stockId) as Promise<bigint>;
}

export async function getHoldings(
  address: string,
  runner?: ContractRunner,
): Promise<HoldingSummary[]> {
  const contractRunner = getRunner(runner);
  const count = await getStockCount(contractRunner);
  const holdings: HoldingSummary[] = [];

  for (let stockId = 1; stockId <= count; stockId += 1) {
    const quantity = await getHoldingUnits(address, stockId, contractRunner);

    if (quantity === BigInt(0)) {
      continue;
    }

    const stock = await getStock(stockId, contractRunner);
    holdings.push({
      stockId,
      symbol: stock.symbol,
      name: stock.name,
      quantity,
      quantityFormatted: formatShareQuantity(quantity),
    });
  }

  return holdings;
}

export async function getTradeCount(runner?: ContractRunner): Promise<number> {
  const contract = getStockContract(getRunner(runner));
  return Number(await contract.tradeCount());
}

export async function getTrade(
  tradeId: number,
  runner?: ContractRunner,
): Promise<TradeSummary> {
  const contract = getStockContract(getRunner(runner));
  const [
    id,
    user,
    stockId,
    side,
    quantity,
    executionPrice,
    totalValue,
    timestamp,
  ] = await contract.getTrade(tradeId);

  return {
    tradeId: Number(id),
    user,
    stockId: Number(stockId),
    side: Number(side) === 0 ? "BUY" : "SELL",
    quantity,
    quantityFormatted: formatShareQuantity(quantity),
    executionPrice,
    totalValue,
    totalValueFormatted: formatVirtualCashFromUnits(totalValue),
    timestamp: Number(timestamp),
  };
}

export async function getTradesForUser(
  address: string,
  runner?: ContractRunner,
): Promise<TradeSummary[]> {
  const contractRunner = getRunner(runner);
  const count = await getTradeCount(contractRunner);
  const trades: TradeSummary[] = [];

  for (let tradeId = 1; tradeId <= count; tradeId += 1) {
    const trade = await getTrade(tradeId, contractRunner);

    if (trade.user.toLowerCase() === address.toLowerCase()) {
      trades.push(trade);
    }
  }

  return trades;
}
