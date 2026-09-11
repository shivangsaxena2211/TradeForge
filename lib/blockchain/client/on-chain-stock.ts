import type { ContractRunner } from "ethers";

import type { OnChainStockQuote } from "@/lib/trading/types";
import { paiseToInrString } from "@/lib/trading/precision";

import { getStockContract } from "./contracts";
import { getClientProvider } from "./provider";
import { getStock, getStockCount } from "./stock";

function getRunner(runner?: ContractRunner): ContractRunner {
  return runner ?? getClientProvider();
}

function mapStockSummaryToQuote(stock: {
  id: number;
  symbol: string;
  name: string;
  price: bigint;
  active: boolean;
}): OnChainStockQuote {
  return {
    stockId: stock.id,
    symbol: stock.symbol,
    name: stock.name,
    pricePaise: stock.price,
    priceInr: paiseToInrString(stock.price),
    active: stock.active,
  };
}

export async function getOnChainStockQuoteById(
  onChainStockId: number,
  runner?: ContractRunner,
): Promise<OnChainStockQuote | null> {
  if (!Number.isInteger(onChainStockId) || onChainStockId <= 0) {
    return null;
  }

  try {
    const stock = await getStock(onChainStockId, getRunner(runner));
    return mapStockSummaryToQuote(stock);
  } catch {
    return null;
  }
}

export async function findOnChainStockBySymbol(
  symbol: string,
  runner?: ContractRunner,
): Promise<OnChainStockQuote | null> {
  const contractRunner = getRunner(runner);
  const count = await getStockCount(contractRunner);
  const target = symbol.trim().toUpperCase();

  for (let stockId = 1; stockId <= count; stockId += 1) {
    const stock = await getStock(stockId, contractRunner);

    if (stock.symbol.toUpperCase() === target) {
      return mapStockSummaryToQuote(stock);
    }
  }

  return null;
}

export async function computeOnChainTradeEstimate(
  pricePaise: bigint,
  quantityUnits: bigint,
  runner?: ContractRunner,
): Promise<bigint> {
  const contract = getStockContract(getRunner(runner));
  return contract.computeTradeValue(pricePaise, quantityUnits) as Promise<bigint>;
}
