import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  isBlockchainConnected: vi.fn(),
  getTransaction: vi.fn(),
  getTransactionReceipt: vi.fn(),
  getBlock: vi.fn(),
}));

vi.mock("@/lib/blockchain/status", () => ({
  isBlockchainConnected: mocks.isBlockchainConnected,
}));

vi.mock("@/lib/blockchain/provider", () => ({
  getBlockchainProvider: () => ({
    getTransaction: mocks.getTransaction,
    getTransactionReceipt: mocks.getTransactionReceipt,
    getBlock: mocks.getBlock,
  }),
}));

import { verifyTransactionOnChain } from "@/lib/blockchain/server-transaction";

const TX_HASH = `0x${"a".repeat(64)}`;

describe("verifyTransactionOnChain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports blockchain unavailable when disconnected", async () => {
    mocks.isBlockchainConnected.mockResolvedValue(false);

    const result = await verifyTransactionOnChain(TX_HASH);

    expect(result.blockchainConnected).toBe(false);
    expect(result.message).toContain("unavailable");
    expect(mocks.getTransaction).not.toHaveBeenCalled();
  });

  it("reports historical record when tx is missing on current chain", async () => {
    mocks.isBlockchainConnected.mockResolvedValue(true);
    mocks.getTransaction.mockResolvedValue(null);
    mocks.getTransactionReceipt.mockResolvedValue(null);

    const result = await verifyTransactionOnChain(TX_HASH);

    expect(result.blockchainConnected).toBe(true);
    expect(result.historicalOnly).toBe(true);
    expect(result.foundOnChain).toBe(false);
    expect(result.message).toContain("current local blockchain");
  });

  it("returns read-only verification details for a found transaction", async () => {
    mocks.isBlockchainConnected.mockResolvedValue(true);
    mocks.getTransaction.mockResolvedValue({
      from: "0x70997970C51812dc3A010C291d957052192A497",
      to: "0x5FC8d32690cc91D4c39d9dabcBD16989F875707",
      blockNumber: 18,
      chainId: BigInt(31337),
    });
    mocks.getTransactionReceipt.mockResolvedValue({
      status: 1,
      blockNumber: 18,
    });
    mocks.getBlock.mockResolvedValue({ timestamp: 1_700_000_000 });

    const result = await verifyTransactionOnChain(TX_HASH);

    expect(result.foundOnChain).toBe(true);
    expect(result.chainId).toBe(31337);
    expect(result.from).toBe("0x70997970C51812dc3A010C291d957052192A497");
    expect(result.receiptStatus).toBe("success");
    expect(result.blockTimestamp).toBe(1_700_000_000);
  });

  it("handles provider errors without throwing", async () => {
    mocks.isBlockchainConnected.mockResolvedValue(true);
    mocks.getTransaction.mockRejectedValue(new Error("rpc down"));

    const result = await verifyTransactionOnChain(TX_HASH);

    expect(result.blockchainConnected).toBe(true);
    expect(result.message).toContain("Unable to verify");
  });
});
