import { JsonRpcProvider } from "ethers";

import { blockchainConfig } from "./config";

let cachedProvider: JsonRpcProvider | null = null;

/**
 * Returns a read-only JSON-RPC provider for the configured local network.
 * No wallet signer or private key is attached.
 */
export function getBlockchainProvider(): JsonRpcProvider {
  if (!cachedProvider) {
    cachedProvider = new JsonRpcProvider(
      blockchainConfig.rpcUrl,
      blockchainConfig.chainId,
      { staticNetwork: true },
    );
  }

  return cachedProvider;
}

/**
 * Reset the cached provider (useful in tests).
 */
export function resetBlockchainProvider(): void {
  cachedProvider = null;
}

export async function getLatestBlockNumber(): Promise<number> {
  const provider = getBlockchainProvider();
  return provider.getBlockNumber();
}
