import "server-only";

import { Contract, JsonRpcProvider, Wallet } from "ethers";

import {
  localContractAddresses,
  stockContractAbi,
} from "@/lib/blockchain/contracts";
import { getAnvilAdminPrivateKey } from "@/lib/blockchain/admin-key";
import { blockchainConfig } from "@/lib/blockchain/config";
import { isBlockchainConnected } from "@/lib/blockchain/status";

function inrToPaise(priceInr: number): bigint {
  return BigInt(Math.round(priceInr * 100));
}

export async function syncOnChainStockPrice(
  onChainStockId: number,
  priceInr: number,
): Promise<{ success: true } | { success: false; error: string }> {
  if (priceInr <= 0) {
    return { success: false, error: "Price must be positive." };
  }

  const connected = await isBlockchainConnected();

  if (!connected) {
    return { success: false, error: "Blockchain unavailable." };
  }

  try {
    const provider = new JsonRpcProvider(
      blockchainConfig.rpcUrl,
      blockchainConfig.chainId,
      { staticNetwork: true },
    );
    const signer = new Wallet(getAnvilAdminPrivateKey(), provider);
    const stock = new Contract(
      localContractAddresses.stock,
      stockContractAbi,
      signer,
    );

    const pricePaise = inrToPaise(priceInr);
    await stock.updateStockPrice(onChainStockId, pricePaise);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? "Unable to update on-chain execution price."
          : "Unable to update on-chain execution price.",
    };
  }
}
