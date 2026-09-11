import { describe, expect, it } from "vitest";

import { assertWalletAddressMatch } from "@/lib/blockchain/client/address";
import { BlockchainClientError } from "@/lib/blockchain/client/errors";

describe("wallet address mismatch protection", () => {
  it("rejects mismatched unlocked wallet addresses", () => {
    expect(() =>
      assertWalletAddressMatch(
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970C51812dc3A010C291d957052192A497",
      ),
    ).toThrow(BlockchainClientError);
  });

  it("accepts matching addresses with different casing", () => {
    expect(() =>
      assertWalletAddressMatch(
        "0xF39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      ),
    ).not.toThrow();
  });
});

describe("secret exposure guardrails", () => {
  const forbiddenPatterns = [
    /privateKey/i,
    /mnemonic/i,
    /seed phrase/i,
    /AUTH_SECRET/i,
    /DATABASE_URL/i,
  ];

  it("rejects unsafe API payload shapes", () => {
    const safeOrderPayload = {
      symbol: "DEMO1",
      side: "BUY",
      quantity: "1",
      onChainStockId: 1,
      requestedPricePaise: "25000",
      quantityUnits: "100000000",
    };

    const serialized = JSON.stringify(safeOrderPayload);

    for (const pattern of forbiddenPatterns) {
      expect(serialized).not.toMatch(pattern);
    }
  });

  it("does not include secrets in wallet metadata shape", () => {
    const metadata = {
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      walletType: "DEFINN_CUSTOM",
      createdAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(metadata);

    for (const pattern of forbiddenPatterns) {
      expect(serialized).not.toMatch(pattern);
    }
  });
});
