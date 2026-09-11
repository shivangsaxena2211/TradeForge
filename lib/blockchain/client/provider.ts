import { JsonRpcProvider } from "ethers";

import { getClientBlockchainConfig } from "./config";

let cachedProvider: JsonRpcProvider | null = null;

/**
 * Read-only JSON-RPC provider for browser-side contract reads.
 * No signer or private key is attached.
 */
export function getClientProvider(): JsonRpcProvider {
  if (!cachedProvider) {
    const config = getClientBlockchainConfig();
    cachedProvider = new JsonRpcProvider(config.rpcUrl, config.chainId, {
      staticNetwork: true,
    });
  }

  return cachedProvider;
}

export function resetClientProvider(): void {
  cachedProvider = null;
}
