import { roundCurrency, roundPercent } from "@/lib/market/calculations";

export type HoldingMetrics = {
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  pnlPercent: number | null;
};

export function computeHoldingMetrics(
  quantity: number,
  averageBuyPrice: number,
  currentPrice: number,
): HoldingMetrics {
  const marketValue = roundCurrency(quantity * currentPrice);
  const costBasis = roundCurrency(quantity * averageBuyPrice);
  const unrealizedPnL = roundCurrency(marketValue - costBasis);
  const pnlPercent =
    costBasis > 0 ? roundPercent((unrealizedPnL / costBasis) * 100) : null;

  return {
    marketValue,
    costBasis,
    unrealizedPnL,
    pnlPercent,
  };
}

export function computeAllocationPercent(
  holdingMarketValue: number,
  totalMarketValue: number,
): number | null {
  if (totalMarketValue <= 0) {
    return null;
  }

  return roundPercent((holdingMarketValue / totalMarketValue) * 100);
}

/**
 * Weighted average buy price after multiple BUY executions.
 * SELLs reduce quantity but do not change the average cost of remaining shares.
 */
export function computeWeightedAverageBuyPrice(
  entries: Array<{ quantity: number; price: number }>,
): number {
  let totalQuantity = 0;
  let totalCost = 0;

  for (const entry of entries) {
    totalQuantity += entry.quantity;
    totalCost += entry.quantity * entry.price;
  }

  if (totalQuantity <= 0) {
    return 0;
  }

  return roundCurrency(totalCost / totalQuantity);
}

export function aggregatePortfolioMetrics(
  holdings: HoldingMetrics[],
): {
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
} {
  let totalMarketValue = 0;
  let totalCostBasis = 0;

  for (const holding of holdings) {
    totalMarketValue += holding.marketValue;
    totalCostBasis += holding.costBasis;
  }

  return {
    totalMarketValue: roundCurrency(totalMarketValue),
    totalCostBasis: roundCurrency(totalCostBasis),
    totalUnrealizedPnL: roundCurrency(totalMarketValue - totalCostBasis),
  };
}
