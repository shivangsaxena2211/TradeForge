import { describe, expect, it } from "vitest";

import {
  buildOnChainIdIndex,
  buildVerifyRows,
  inrToPaise,
  normalizeOnChainSymbol,
  resolveCanonicalOnChainStockId,
  verifySymbolMatch,
  type DatabaseStockForSetup,
  type OnChainStockSnapshot,
} from "@/lib/blockchain/on-chain-stock-setup";

describe("on-chain stock mapping helpers", () => {
  it("converts INR prices to paise", () => {
    expect(inrToPaise(1415)).toBe(BigInt(141500));
    expect(inrToPaise(2850.2)).toBe(BigInt(285020));
  });

  it("rejects invalid INR prices", () => {
    expect(() => inrToPaise(0)).toThrow("Invalid INR price");
    expect(() => inrToPaise(-1)).toThrow("Invalid INR price");
  });

  it("normalizes on-chain symbols", () => {
    expect(normalizeOnChainSymbol("adaniEnt")).toBe("ADANIENT");
    expect(normalizeOnChainSymbol(" M&M ")).toBe("M&M");
  });

  it("verifies symbol matches case-insensitively", () => {
    expect(verifySymbolMatch("RELIANCE", "reliance")).toBe(true);
    expect(verifySymbolMatch("M&M", "M&M")).toBe(true);
    expect(verifySymbolMatch("TCS", "INFY")).toBe(false);
  });
});

describe("on-chain verification rows", () => {
  const activeStock: DatabaseStockForSetup = {
    id: "db-1",
    symbol: "ADANIENT",
    exchange: "NSE",
    companyName: "Adani Enterprises Ltd.",
    currentPrice: { toString: () => "2850.00" },
    isActive: true,
    simulationEnabled: true,
    onChainStockId: 4,
  };

  const index = new Map<string, OnChainStockSnapshot>([
    [
      "ADANIENT",
      {
        stockId: 4,
        symbol: "ADANIENT",
        name: "Adani Enterprises Ltd.",
        pricePaise: BigInt(285000),
        active: true,
      },
    ],
  ]);

  it("passes when database and on-chain mappings align", () => {
    const result = buildVerifyRows([activeStock], index);

    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.rows[0]?.status).toBe("PASS");
  });

  it("fails when onChainStockId is missing", () => {
    const result = buildVerifyRows(
      [{ ...activeStock, onChainStockId: null }],
      index,
    );

    expect(result.failed).toBe(1);
    expect(result.rows[0]?.detail).toContain("Missing onChainStockId");
  });

  it("fails when mapped ID does not match on-chain stock", () => {
    const result = buildVerifyRows(
      [{ ...activeStock, onChainStockId: 99 }],
      index,
    );

    expect(result.failed).toBe(1);
    expect(result.rows[0]?.detail).toContain("PostgreSQL stores 99");
  });

  it("fails when on-chain symbol mismatches database symbol", () => {
    const mismatchedIndex = new Map<string, OnChainStockSnapshot>([
      [
        "ADANIENT",
        {
          stockId: 4,
          symbol: "ADANIX",
          name: "Wrong",
          pricePaise: BigInt(285000),
          active: true,
        },
      ],
    ]);

    const result = buildVerifyRows([activeStock], mismatchedIndex);

    expect(result.failed).toBe(1);
    expect(result.rows[0]?.detail).toContain("points to ADANIX");
  });

  it("detects stale PostgreSQL IDs after a fresh Stock.sol deployment", () => {
    const staleIndex = new Map<string, OnChainStockSnapshot>([
      [
        "ADANIPORTS",
        {
          stockId: 2,
          symbol: "ADANIPORTS",
          name: "Adani Ports and Special Economic Zone Ltd.",
          pricePaise: BigInt(142000),
          active: true,
        },
      ],
      [
        "AXISBANK",
        {
          stockId: 4,
          symbol: "AXISBANK",
          name: "Axis Bank Ltd.",
          pricePaise: BigInt(112000),
          active: true,
        },
      ],
      [
        "RELIANCE",
        {
          stockId: 20,
          symbol: "RELIANCE",
          name: "Reliance Industries Ltd.",
          pricePaise: BigInt(141500),
          active: true,
        },
      ],
    ]);

    const staleStocks: DatabaseStockForSetup[] = [
      {
        id: "db-adaniports",
        symbol: "ADANIPORTS",
        exchange: "NSE",
        companyName: "Adani Ports and Special Economic Zone Ltd.",
        currentPrice: { toString: () => "1420.00" },
        isActive: true,
        simulationEnabled: true,
        onChainStockId: 20,
      },
      {
        id: "db-axisbank",
        symbol: "AXISBANK",
        exchange: "NSE",
        companyName: "Axis Bank Ltd.",
        currentPrice: { toString: () => "1120.00" },
        isActive: true,
        simulationEnabled: true,
        onChainStockId: 2,
      },
    ];

    const before = buildVerifyRows(staleStocks, staleIndex);
    expect(before.failed).toBe(2);
    expect(before.rows[0]?.detail).toContain("points to RELIANCE");
    expect(before.rows[1]?.detail).toContain("points to ADANIPORTS");

    const idIndex = buildOnChainIdIndex(staleIndex);
    const adaniResolution = resolveCanonicalOnChainStockId(
      staleStocks[0],
      staleIndex,
      idIndex,
    );
    const axisResolution = resolveCanonicalOnChainStockId(
      staleStocks[1],
      staleIndex,
      idIndex,
    );

    expect(adaniResolution.kind).toBe("ok");
    if (adaniResolution.kind === "ok") {
      expect(adaniResolution.onChainStockId).toBe(2);
      expect(adaniResolution.needsRemap).toBe(true);
    }

    expect(axisResolution.kind).toBe("ok");
    if (axisResolution.kind === "ok") {
      expect(axisResolution.onChainStockId).toBe(4);
      expect(axisResolution.needsRemap).toBe(true);
    }

    const after = buildVerifyRows(
      [
        { ...staleStocks[0], onChainStockId: 2 },
        { ...staleStocks[1], onChainStockId: 4 },
      ],
      staleIndex,
    );

    expect(after.passed).toBe(2);
    expect(after.failed).toBe(0);
  });

  it("fails when on-chain stock is inactive", () => {
    const inactiveIndex = new Map<string, OnChainStockSnapshot>([
      [
        "ADANIENT",
        {
          stockId: 4,
          symbol: "ADANIENT",
          name: "Adani Enterprises Ltd.",
          pricePaise: BigInt(285000),
          active: false,
        },
      ],
    ]);

    const result = buildVerifyRows([activeStock], inactiveIndex);

    expect(result.failed).toBe(1);
    expect(result.rows[0]?.detail).toContain("inactive");
  });
});
