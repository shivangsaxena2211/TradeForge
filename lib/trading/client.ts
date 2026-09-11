import type { Signer, TransactionReceipt } from "ethers";

import {
  assertWalletAddressMatch,
  createConnectedSigner,
  executeContractTransaction,
  getStockContract,
  type TransactionProgress,
} from "@/lib/blockchain/client";
import type { EthersWallet } from "@/lib/wallet/types";

import type { TradeSide } from "./types";

export type TradeExecutionProgress = TransactionProgress | { status: "signing" };

export async function executeMarketTrade(
  wallet: EthersWallet,
  databaseAddress: string,
  onChainStockId: number,
  side: TradeSide,
  quantityUnits: bigint,
  onProgress?: (progress: TradeExecutionProgress) => void,
): Promise<TransactionReceipt> {
  assertWalletAddressMatch(databaseAddress, wallet.address);

  onProgress?.({ status: "confirming" });

  const signer = await createConnectedSigner(wallet);
  const contract = getStockContract(signer);

  onProgress?.({ status: "signing" });

  const sendTransaction = async () => {
    if (side === "BUY") {
      return contract.buy(onChainStockId, quantityUnits);
    }

    return contract.sell(onChainStockId, quantityUnits);
  };

  return executeContractTransaction(sendTransaction, (progress) => {
    onProgress?.(progress);
  });
}

export async function executeMarketTradeWithSigner(
  signer: Signer,
  onChainStockId: number,
  side: TradeSide,
  quantityUnits: bigint,
  onProgress?: (progress: TradeExecutionProgress) => void,
): Promise<TransactionReceipt> {
  const contract = getStockContract(signer);

  onProgress?.({ status: "signing" });

  const sendTransaction = async () => {
    if (side === "BUY") {
      return contract.buy(onChainStockId, quantityUnits);
    }

    return contract.sell(onChainStockId, quantityUnits);
  };

  return executeContractTransaction(sendTransaction, (progress) => {
    onProgress?.(progress);
  });
}
