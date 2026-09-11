import { describe, expect, it, beforeEach } from "vitest";
import { JsonRpcProvider } from "ethers";

import { blockchainConfig } from "@/lib/blockchain/config";
import { formatNativeBalance } from "@/lib/blockchain/format";
import {
  getBlockchainProvider,
  resetBlockchainProvider,
} from "@/lib/blockchain/provider";

const ONE_ETHER = BigInt("1000000000000000000");

describe("blockchain configuration", () => {
  it("uses the default local RPC URL", () => {
    expect(blockchainConfig.rpcUrl).toBe("http://127.0.0.1:8545");
  });

  it("uses the default Anvil chain ID", () => {
    expect(blockchainConfig.chainId).toBe(31337);
  });

  it("uses the DEFINN local network name", () => {
    expect(blockchainConfig.networkName).toBe("DEFINN Local Network");
  });

  it("marks the network as local development", () => {
    expect(blockchainConfig.isLocalDevelopment).toBe(true);
  });
});

describe("blockchain provider", () => {
  beforeEach(() => {
    resetBlockchainProvider();
  });

  it("can construct a JsonRpcProvider", () => {
    const provider = getBlockchainProvider();
    expect(provider).toBeInstanceOf(JsonRpcProvider);
  });

  it("handles missing RPC safely in status checks", async () => {
    const invalidConfigProvider = new JsonRpcProvider(
      "http://127.0.0.1:1",
      31337,
      { staticNetwork: true },
    );

    await expect(invalidConfigProvider.getBlockNumber()).rejects.toThrow();
  });
});

describe("native balance formatting", () => {
  it("formats zero wei as 0.0000 ETH", () => {
    expect(formatNativeBalance(BigInt(0))).toBe("0.0000 ETH");
  });

  it("formats one ether correctly", () => {
    expect(formatNativeBalance(ONE_ETHER)).toBe("1.0000 ETH");
  });
});

describe("blockchain status API contract", () => {
  it("defines a safe disconnected status shape", () => {
    const disconnected = {
      connected: false,
      chainId: null,
      blockNumber: null,
      networkName: blockchainConfig.networkName,
      rpcUrl: blockchainConfig.rpcUrl,
      reason: "Local blockchain is not running.",
    };

    expect(disconnected.connected).toBe(false);
    expect(disconnected).not.toHaveProperty("privateKey");
    expect(disconnected).not.toHaveProperty("mnemonic");
  });
});
