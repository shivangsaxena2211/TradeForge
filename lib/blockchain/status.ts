import "server-only";

import { isAddress } from "ethers";

import { blockchainConfig } from "./config";
import { formatNativeBalance } from "./format";
import { getBlockchainProvider } from "./provider";
import type { BlockchainStatus } from "./types";

function disconnectedStatus(reason: string, chainId: number | null = null): BlockchainStatus {
  return {
    connected: false,
    chainId,
    blockNumber: null,
    networkName: blockchainConfig.networkName,
    rpcUrl: blockchainConfig.rpcUrl,
    reason,
  };
}

export async function getBlockchainStatus(): Promise<BlockchainStatus> {
  try {
    const provider = getBlockchainProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const chainId = Number(network.chainId);

    if (chainId !== blockchainConfig.chainId) {
      return disconnectedStatus(
        `Connected chain ID (${chainId}) does not match configured CHAIN_ID (${blockchainConfig.chainId}).`,
        chainId,
      );
    }

    return {
      connected: true,
      chainId,
      blockNumber,
      networkName: blockchainConfig.networkName,
      rpcUrl: blockchainConfig.rpcUrl,
    };
  } catch (error) {
    console.error("Blockchain status check failed:", error);

    return disconnectedStatus(
      "Local blockchain is not running. Start the DEFINN local blockchain to enable connectivity.",
    );
  }
}

export async function isBlockchainConnected(): Promise<boolean> {
  const status = await getBlockchainStatus();
  return status.connected;
}

export async function getNativeBalance(address: string): Promise<string> {
  if (!isAddress(address)) {
    throw new Error("Invalid Ethereum address.");
  }

  const status = await getBlockchainStatus();

  if (!status.connected) {
    return "0.0000 ETH";
  }

  const provider = getBlockchainProvider();
  const balanceWei = await provider.getBalance(address);

  return formatNativeBalance(balanceWei);
}

export async function getNativeBalanceWei(address: string): Promise<bigint> {
  if (!isAddress(address)) {
    throw new Error("Invalid Ethereum address.");
  }

  const provider = getBlockchainProvider();
  return provider.getBalance(address);
}
