import { describe, expect, it } from "vitest";

import { marketSearchSchema, watchlistSymbolSchema } from "@/lib/validation/market";
import { createOrderSchema, syncOrderSchema } from "@/lib/validation/trading";
import { transactionListQuerySchema } from "@/lib/validation/transactions";

describe("trading API validation", () => {
  it("rejects invalid symbols", () => {
    const parsed = createOrderSchema.safeParse({
      symbol: "bad symbol!",
      side: "BUY",
      quantity: "1",
      onChainStockId: 1,
      requestedPricePaise: "25000",
      quantityUnits: "100000000",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects mismatched quantity units", () => {
    const parsed = createOrderSchema.safeParse({
      symbol: "DEMO1",
      side: "BUY",
      quantity: "1",
      onChainStockId: 1,
      requestedPricePaise: "25000",
      quantityUnits: "1",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects malformed sync hashes", () => {
    expect(syncOrderSchema.safeParse({ txHash: "abc" }).success).toBe(false);
  });
});

describe("transaction API validation", () => {
  it("rejects unsupported status filters", () => {
    const parsed = transactionListQuerySchema.safeParse({ status: "EXECUTED" });
    expect(parsed.success).toBe(false);
  });

  it("caps page size at 100", () => {
    const parsed = transactionListQuerySchema.safeParse({ pageSize: 500 });
    expect(parsed.success).toBe(false);
  });
});

describe("market API validation", () => {
  it("rejects invalid watchlist symbols", () => {
    const parsed = watchlistSymbolSchema.safeParse({ symbol: "../DEMO1" });
    expect(parsed.success).toBe(false);
  });

  it("accepts bounded market search params", () => {
    const parsed = marketSearchSchema.safeParse({
      search: "demo",
      exchange: "NSE",
      activeOnly: "true",
      sort: "symbol",
      order: "asc",
    });

    expect(parsed.success).toBe(true);
  });
});
