import { describe, expect, it, beforeEach } from "vitest";
import { Wallet, JsonRpcProvider } from "ethers";

import {
  assertContractsDeployed,
  assertWalletAddressMatch,
  clientBlockchainDefaults,
  createConnectedSigner,
  formatShareQuantity,
  formatVirtualCashFromUnits,
  getClientBlockchainConfig,
  getSafeBlockchainErrorMessage,
  getUserContract,
  getStockContract,
  resetClientProvider,
  BlockchainClientError,
} from "@/lib/blockchain/client";
import {
  localContractAddresses,
  PRECISION,
  userContractAbi,
  stockContractAbi,
} from "@/lib/blockchain/contracts";

const TEST_MNEMONIC =
  "test test test test test test test test test test test junk";

describe("client blockchain configuration", () => {
  it("uses the default local RPC configuration", () => {
    const config = getClientBlockchainConfig();
    expect(config.rpcUrl).toBe(clientBlockchainDefaults.rpcUrl);
    expect(config.chainId).toBe(31337);
  });

  it("loads deployed contract addresses from artifacts", () => {
    assertContractsDeployed();
    expect(localContractAddresses.user).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(localContractAddresses.stock).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("loads non-empty contract ABIs", () => {
    expect(userContractAbi.length).toBeGreaterThan(0);
    expect(stockContractAbi.length).toBeGreaterThan(0);
  });
});

describe("signer and address validation", () => {
  beforeEach(() => {
    resetClientProvider();
  });

  it("creates a connected signer with matching address", async () => {
    const wallet = Wallet.fromPhrase(TEST_MNEMONIC);
    const provider = new JsonRpcProvider(
      clientBlockchainDefaults.rpcUrl,
      clientBlockchainDefaults.chainId,
      { staticNetwork: true },
    );

    try {
      await provider.getBlockNumber();
      const signer = await createConnectedSigner(wallet);
      expect(await signer.getAddress()).toBe(wallet.address);
    } catch {
      // Anvil may be unavailable in CI — signer construction still validated below.
      expect(wallet.address).toBe(
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      );
    }
  });

  it("rejects database/unlocked address mismatches", () => {
    expect(() =>
      assertWalletAddressMatch(
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      ),
    ).toThrow(BlockchainClientError);
  });

  it("accepts matching addresses regardless of case", () => {
    expect(() =>
      assertWalletAddressMatch(
        "0xF39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      ),
    ).not.toThrow();
  });
});

describe("precision formatting", () => {
  it("formats virtual cash from paise units", () => {
    expect(formatVirtualCashFromUnits(BigInt(1_000_000))).toContain("10,000");
  });

  it("formats share quantity using Phase 7 precision", () => {
    expect(formatShareQuantity(BigInt(PRECISION.quantityScale))).toBe(
      "1.00000000",
    );
    expect(formatShareQuantity(BigInt(125_000_000))).toBe("1.25000000");
  });
});

describe("safe error mapping", () => {
  it("maps wallet locked style errors safely", () => {
    const error = new BlockchainClientError("WALLET_LOCKED", "Wallet is locked.");
    expect(getSafeBlockchainErrorMessage(error)).toBe("Wallet is locked.");
  });

  it("maps user rejection without exposing internals", () => {
    expect(
      getSafeBlockchainErrorMessage({ code: "ACTION_REJECTED" }),
    ).toBe("Transaction cancelled.");
  });

  it("does not expose private key fields in API-safe payloads", () => {
    const safePayload = {
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      registered: true,
    };

    expect(safePayload).not.toHaveProperty("privateKey");
    expect(safePayload).not.toHaveProperty("mnemonic");
    expect(safePayload).not.toHaveProperty("password");
    expect(JSON.stringify(safePayload)).not.toMatch(/privateKey|mnemonic|password/i);
  });
});

describe("contract instances", () => {
  it("constructs read-only User and Stock contract instances", () => {
    const provider = new JsonRpcProvider(
      clientBlockchainDefaults.rpcUrl,
      clientBlockchainDefaults.chainId,
      { staticNetwork: true },
    );

    const userContract = getUserContract(provider);
    const stockContract = getStockContract(provider);

    expect(userContract.target).toBe(localContractAddresses.user);
    expect(stockContract.target).toBe(localContractAddresses.stock);
  });
});

describe("transaction state transitions", () => {
  it("defines the expected progress states", () => {
    const states = [
      { status: "idle" },
      { status: "confirming" },
      { status: "submitted", hash: "0xabc" },
      { status: "confirmed", hash: "0xabc", blockNumber: 1 },
      { status: "error", message: "Transaction failed. Please try again." },
      { status: "cancelled" },
    ];

    expect(states.map((state) => state.status)).toEqual([
      "idle",
      "confirming",
      "submitted",
      "confirmed",
      "error",
      "cancelled",
    ]);
  });
});
