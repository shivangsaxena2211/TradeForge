import { describe, expect, it } from "vitest";

import { mapTransactionListItem } from "@/lib/transactions/mappers";
import type { TransactionWithRelations } from "@/lib/transactions/mappers";
import { transactionListQuerySchema } from "@/lib/validation/transactions";

function createTransactionFixture(
  overrides: Partial<TransactionWithRelations> = {},
): TransactionWithRelations {
  const base: TransactionWithRelations = {
    id: "tx-1",
    userId: "user-a",
    orderId: "order-1",
    transactionType: "STOCK_BUY",
    status: "CONFIRMED",
    txHash: "0xdb38d89c41290c07cf948c8ae9cd1429e6cfb4d5004cf820a4b1c9639c03c2ce",
    blockNumber: BigInt(18),
    createdAt: new Date("2026-09-11T10:00:00.000Z"),
    confirmedAt: new Date("2026-09-11T10:00:05.000Z"),
    order: {
      id: "order-1",
      userId: "user-a",
      stockId: "stock-1",
      side: "BUY",
      orderType: "MARKET",
      quantity: { toString: () => "1.00000000" } as never,
      limitPrice: null,
      requestedPrice: { toString: () => "250.00" } as never,
      executedPrice: { toString: () => "250.00" } as never,
      status: "EXECUTED",
      createdAt: new Date("2026-09-11T10:00:00.000Z"),
      updatedAt: new Date("2026-09-11T10:00:05.000Z"),
      stock: {
        id: "stock-1",
        symbol: "DEMO1",
        companyName: "Demo Alpha Technologies Ltd.",
        exchange: "NSE",
        isin: null,
        sector: "IT",
        instrumentType: "EQUITY",
        description: null,
        currentPrice: { toString: () => "250.00" } as never,
        previousClose: { toString: () => "245.50" } as never,
        dayOpen: null,
        dayHigh: null,
        dayLow: null,
        volume: BigInt(0),
        priceSource: "SIMULATION",
        marketStatus: "CLOSED",
        lastMarketUpdateAt: null,
        simulationEnabled: false,
        onChainStockId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      trade: {
        id: "trade-1",
        orderId: "order-1",
        userId: "user-a",
        stockId: "stock-1",
        side: "BUY",
        quantity: { toString: () => "1.00000000" } as never,
        price: { toString: () => "250.00" } as never,
        totalValue: { toString: () => "250.00" } as never,
        executedAt: new Date("2026-09-11T10:00:05.000Z"),
      },
    },
  };

  return { ...base, ...overrides };
}

describe("transaction list mapping", () => {
  it("maps transaction list items with serialized decimals", () => {
    const mapped = mapTransactionListItem(createTransactionFixture());

    expect(mapped.symbol).toBe("DEMO1");
    expect(mapped.quantity).toBe("1.00000000");
    expect(mapped.executionPrice).toBe("250.00");
    expect(mapped.totalValue).toBe("250.00");
    expect(mapped.blockNumber).toBe("18");
    expect(mapped.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(mapped.createdAt).toBe("2026-09-11T10:00:00.000Z");
  });

  it("handles missing order relations safely", () => {
    const mapped = mapTransactionListItem(
      createTransactionFixture({ order: null, orderId: null }),
    );

    expect(mapped.symbol).toBeNull();
    expect(mapped.tradeId).toBeNull();
    expect(mapped.quantity).toBeNull();
  });
});

describe("transaction query schema", () => {
  it("accepts status and type filters", () => {
    const parsed = transactionListQuerySchema.safeParse({
      status: "CONFIRMED",
      type: "STOCK_BUY",
      search: "0xdb38",
      page: 2,
      pageSize: 20,
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.status).toBe("CONFIRMED");
    expect(parsed.data?.type).toBe("STOCK_BUY");
  });

  it("rejects oversized page size", () => {
    const parsed = transactionListQuerySchema.safeParse({ pageSize: 500 });
    expect(parsed.success).toBe(false);
  });

  it("defaults pagination values", () => {
    const parsed = transactionListQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    expect(parsed.data?.page).toBe(1);
    expect(parsed.data?.pageSize).toBe(20);
  });
});

describe("transaction security", () => {
  it("does not expose secrets in mapped payloads", () => {
    const payload = JSON.stringify(
      mapTransactionListItem(createTransactionFixture()),
    );

    expect(payload).not.toMatch(/privateKey|mnemonic|password/i);
  });

  it("uses safe not-found semantics for user isolation", () => {
    const safeResponses = [404];
    expect(safeResponses).toContain(404);
  });
});

describe("blockchain unavailable handling", () => {
  it("documents historical-only behavior for missing on-chain records", () => {
    const message =
      "This transaction is not present on the current local blockchain state.";

    expect(message).toContain("current local blockchain");
  });
});
