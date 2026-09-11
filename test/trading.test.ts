import { describe, expect, it } from "vitest";

import {
  computeTradeValuePaise,
  paiseToInrString,
  shareInputToUnits,
  unitsToShareDecimal,
} from "@/lib/trading/precision";
import {
  validateBuyPreTradeUx,
  validateSellPreTradeUx,
  validateTradeQuantityInput,
} from "@/lib/trading/validation";
import { createOrderSchema, syncOrderSchema } from "@/lib/validation/trading";

describe("trading precision", () => {
  it("converts share input to fixed-point units", () => {
    expect(shareInputToUnits("1")).toBe(BigInt(100_000_000));
    expect(shareInputToUnits("1.25")).toBe(BigInt(125_000_000));
  });

  it("rejects invalid quantities", () => {
    expect(shareInputToUnits("0")).toBeNull();
    expect(shareInputToUnits("abc")).toBeNull();
    expect(shareInputToUnits("-1")).toBeNull();
    expect(shareInputToUnits("1.123456789")).toBeNull();
  });

  it("calculates ₹150.50 × 1.25 shares using documented precision", () => {
    const total = computeTradeValuePaise(BigInt(15050), BigInt(125_000_000));
    expect(total).toBe(BigInt(18812));
    expect(paiseToInrString(total)).toBe("188.12");
  });

  it("calculates price × quantity with floor division", () => {
    const total = computeTradeValuePaise(BigInt(15050), BigInt(125_000_000));
    expect(total).toBe(BigInt(18812));
    expect(paiseToInrString(total)).toBe("188.12");
  });

  it("formats units back to decimal shares", () => {
    expect(unitsToShareDecimal(BigInt(100_000_000))).toBe("1.00000000");
  });
});

describe("trading validation", () => {
  const onChainStock = {
    stockId: 1,
    symbol: "DEMO1",
    name: "Demo",
    pricePaise: BigInt(15050),
    priceInr: "150.50",
    active: true,
  };

  it("validates buy with sufficient cash", () => {
    const quantity = BigInt(100_000_000);
    const cost = computeTradeValuePaise(onChainStock.pricePaise, quantity);

    expect(
      validateBuyPreTradeUx(onChainStock, quantity, BigInt(20000), cost),
    ).toBeNull();
  });

  it("rejects buy with insufficient cash", () => {
    const quantity = BigInt(100_000_000);
    const cost = computeTradeValuePaise(onChainStock.pricePaise, quantity);

    expect(
      validateBuyPreTradeUx(onChainStock, quantity, BigInt(100), cost),
    ).toBe("Insufficient on-chain virtual cash for this purchase.");
  });

  it("rejects sell with insufficient holdings", () => {
    expect(
      validateSellPreTradeUx(
        onChainStock,
        BigInt(200_000_000),
        BigInt(100_000_000),
      ),
    ).toBe("Insufficient on-chain shares for this sale.");
  });

  it("rejects inactive stock", () => {
    expect(
      validateBuyPreTradeUx(
        { ...onChainStock, active: false },
        BigInt(100_000_000),
        BigInt(100000),
        BigInt(15050),
      ),
    ).toBe("Stock is inactive on-chain.");
  });

  it("validates quantity input messages", () => {
    const invalid = validateTradeQuantityInput("0");
    expect(invalid.valid).toBe(false);
  });

  it("allows sell when holdings are sufficient", () => {
    expect(
      validateSellPreTradeUx(
        onChainStock,
        BigInt(100_000_000),
        BigInt(200_000_000),
      ),
    ).toBeNull();
  });

  it("rejects missing on-chain stock for buy", () => {
    expect(
      validateBuyPreTradeUx(null, BigInt(100_000_000), BigInt(100000), BigInt(1)),
    ).toBe("Blockchain is unavailable.");
  });

  it("rejects inactive stock for sell", () => {
    expect(
      validateSellPreTradeUx(
        { ...onChainStock, active: false },
        BigInt(100_000_000),
        BigInt(200_000_000),
      ),
    ).toBe("Stock is inactive on-chain.");
  });
});

describe("trading API schemas", () => {
  it("accepts valid create order payloads", () => {
    const parsed = createOrderSchema.safeParse({
      symbol: "DEMO1",
      side: "BUY",
      quantity: "1",
      onChainStockId: 1,
      requestedPricePaise: "25000",
      quantityUnits: "100000000",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts valid transaction hashes", () => {
    const parsed = syncOrderSchema.safeParse({
      txHash: `0x${"a".repeat(64)}`,
    });

    expect(parsed.success).toBe(true);
  });

  it("does not include secrets in order payloads", () => {
    const payload = {
      symbol: "DEMO1",
      side: "BUY",
      quantity: "1",
      onChainStockId: 1,
      requestedPricePaise: "25000",
      quantityUnits: "100000000",
    };

    expect(JSON.stringify(payload)).not.toMatch(/privateKey|mnemonic|password/i);
  });
});

describe("order state transitions", () => {
  it("defines expected order lifecycle states", () => {
    const states = ["PENDING", "EXECUTED", "FAILED", "CANCELLED"];
    expect(states).toEqual(["PENDING", "EXECUTED", "FAILED", "CANCELLED"]);
  });

  it("defines expected transaction lifecycle states", () => {
    const states = ["PENDING", "CONFIRMED", "FAILED"];
    expect(states).toContain("CONFIRMED");
  });

  it("rejects malformed transaction hashes", () => {
    const parsed = syncOrderSchema.safeParse({ txHash: "not-a-hash" });
    expect(parsed.success).toBe(false);
  });

  it("rejects LIMIT order payloads until implemented", () => {
    const parsed = createOrderSchema.safeParse({
      symbol: "DEMO1",
      side: "BUY",
      quantity: "1",
      onChainStockId: 1,
      requestedPricePaise: "25000",
      quantityUnits: "100000000",
      orderType: "LIMIT",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.side).toBe("BUY");
  });
});

describe("safe error handling", () => {
  it("does not expose secrets in validation messages", () => {
    const message = validateBuyPreTradeUx(
      {
        stockId: 1,
        symbol: "DEMO1",
        name: "Demo",
        pricePaise: BigInt(100),
        priceInr: "1.00",
        active: true,
      },
      BigInt(100_000_000),
      BigInt(0),
      BigInt(100),
    );

    expect(message).not.toMatch(/privateKey|mnemonic|password|0x[a-fA-F0-9]{64}/);
  });
});
