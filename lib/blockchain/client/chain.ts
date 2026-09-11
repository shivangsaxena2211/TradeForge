import type { JsonRpcProvider } from "ethers";

import { getClientBlockchainConfig } from "./config";
import { BlockchainClientError } from "./errors";

export async function validateChainId(
  provider: JsonRpcProvider,
): Promise<void> {
  const config = getClientBlockchainConfig();

  try {
    const network = await provider.getNetwork();

    if (Number(network.chainId) !== config.chainId) {
      throw new BlockchainClientError(
        "WRONG_NETWORK",
        `Wrong blockchain network. Expected chain ID ${config.chainId}.`,
      );
    }
  } catch (error) {
    if (error instanceof BlockchainClientError) {
      throw error;
    }

    throw new BlockchainClientError(
      "BLOCKCHAIN_UNAVAILABLE",
      "Blockchain is unavailable.",
    );
  }
}
