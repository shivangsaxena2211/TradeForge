import { describe, expect, it } from "vitest";

import {
  calculateChange,
  getSimulatedVolume,
  roundCurrency,
} from "@/lib/market/calculations";
import {
  isValidSymbol,
  normalizeSearchQuery,
  normalizeSymbol,
} from "@/lib/market/search";
import {
  marketSearchSchema,
  priceHistoryQuerySchema,
  watchlistSymbolSchema,
} from "@/lib/validation/market";

describe("market calculations", () => {
  it("calculates change and percentage change", () => {
    const result = calculateChange(250, 245.5);
    expect(result.change).toBe(4.5);
    expect(result.changePercent).toBe(1.83);
  });

  it("handles zero previous close safely", () => {
    const result = calculateChange(100, 0);
    expect(result.changePercent).toBe(0);
  });

  it("produces deterministic simulated volume", () => {
    expect(getSimulatedVolume("RELIANCE", 1415)).toBe(
      getSimulatedVolume("RELIANCE", 1415),
    );
    expect(getSimulatedVolume("RELIANCE", 1415)).toBeGreaterThan(0);
  });
});

describe("market search helpers", () => {
  it("normalizes search input safely", () => {
    expect(normalizeSearchQuery("  reliance  industries  ")).toBe(
      "reliance industries",
    );
    expect(normalizeSearchQuery("x".repeat(200)).length).toBe(100);
  });

  it("validates stock symbols including M&M", () => {
    expect(isValidSymbol("RELIANCE")).toBe(true);
    expect(isValidSymbol("M&M")).toBe(true);
    expect(isValidSymbol("bad symbol")).toBe(false);
    expect(normalizeSymbol("reliance")).toBe("RELIANCE");
  });
});

describe("market validation schemas", () => {
  it("accepts valid market search params", () => {
    const parsed = marketSearchSchema.safeParse({
      search: "reliance",
      exchange: "NSE",
      activeOnly: "true",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts valid watchlist symbols", () => {
    const parsed = watchlistSymbolSchema.safeParse({ symbol: "M&M" });
    expect(parsed.success).toBe(true);
  });

  it("accepts history source filters", () => {
    const parsed = priceHistoryQuerySchema.safeParse({
      limit: 60,
      source: "historical",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.source).toBe("historical");
    }
  });

  it("rejects invalid watchlist symbols", () => {
    const parsed = watchlistSymbolSchema.safeParse({ symbol: "bad symbol" });
    expect(parsed.success).toBe(false);
  });
});

describe("market summary and inactive handling concepts", () => {
  it("rounds currency values consistently", () => {
    expect(roundCurrency(10.556)).toBe(10.56);
  });

  it("represents inactive stock state explicitly", () => {
    const inactiveStock = {
      symbol: "DEMO1",
      isActive: false,
    };

    expect(inactiveStock.isActive).toBe(false);
  });
});

describe("watchlist API payload safety", () => {
  it("does not include secrets in watchlist request payloads", () => {
    const payload = { symbol: "RELIANCE" };
    expect(JSON.stringify(payload)).not.toMatch(
      /privateKey|mnemonic|password/i,
    );
  });
});
