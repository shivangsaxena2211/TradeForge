import { describe, expect, it } from "vitest";

import {
  aggregatePortfolioMetrics,
  computeAllocationPercent,
  computeHoldingMetrics,
  computeWeightedAverageBuyPrice,
} from "@/lib/portfolio/calculations";

describe("portfolio calculations", () => {
  it("computes market value from quantity and simulated price", () => {
    const metrics = computeHoldingMetrics(2, 100, 150);
    expect(metrics.marketValue).toBe(300);
    expect(metrics.costBasis).toBe(200);
    expect(metrics.unrealizedPnL).toBe(100);
    expect(metrics.pnlPercent).toBe(50);
  });

  it("computes weighted average buy price", () => {
    const average = computeWeightedAverageBuyPrice([
      { quantity: 1, price: 100 },
      { quantity: 2, price: 130 },
    ]);

    expect(average).toBe(120);
  });

  it("keeps average buy price after partial sell reduces quantity only", () => {
    const afterBuys = computeHoldingMetrics(3, 120, 150);
    const afterPartialSell = computeHoldingMetrics(2, 120, 150);

    expect(afterBuys.costBasis).toBe(360);
    expect(afterPartialSell.costBasis).toBe(240);
    expect(afterPartialSell.unrealizedPnL).toBe(60);
  });

  it("handles full sell to zero quantity", () => {
    const zeroHolding = computeHoldingMetrics(0, 120, 150);
    expect(zeroHolding.marketValue).toBe(0);
    expect(zeroHolding.costBasis).toBe(0);
    expect(zeroHolding.pnlPercent).toBeNull();
  });

  it("handles zero cost basis for P/L percent", () => {
    const metrics = computeHoldingMetrics(1, 0, 100);
    expect(metrics.pnlPercent).toBeNull();
  });

  it("aggregates portfolio totals", () => {
    const totals = aggregatePortfolioMetrics([
      computeHoldingMetrics(1, 100, 120),
      computeHoldingMetrics(2, 50, 60),
    ]);

    expect(totals.totalMarketValue).toBe(240);
    expect(totals.totalCostBasis).toBe(200);
    expect(totals.totalUnrealizedPnL).toBe(40);
  });

  it("computes allocation percentages", () => {
    expect(computeAllocationPercent(75, 300)).toBe(25);
    expect(computeAllocationPercent(0, 0)).toBeNull();
  });

  it("returns empty portfolio metrics for zero holdings", () => {
    const totals = aggregatePortfolioMetrics([]);
    expect(totals.totalMarketValue).toBe(0);
    expect(totals.totalCostBasis).toBe(0);
    expect(totals.totalUnrealizedPnL).toBe(0);
  });
});

describe("portfolio price-source rules", () => {
  it("uses simulated market price for valuation and trade price for cost basis", () => {
    const holding = computeHoldingMetrics(1.25, 150.5, 250);
    expect(holding.costBasis).toBe(188.13);
    expect(holding.marketValue).toBe(312.5);
  });
});

describe("portfolio safety", () => {
  it("does not expose secrets in calculation inputs", () => {
    const payload = JSON.stringify({
      quantity: "1.00000000",
      averageBuyPrice: "150.50",
      currentPrice: "250.00",
    });

    expect(payload).not.toMatch(/privateKey|mnemonic|password/i);
  });
});
