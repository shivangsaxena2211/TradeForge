import type { ContractTransactionResponse, TransactionReceipt } from "ethers";

import { getSafeBlockchainErrorMessage } from "./errors";

export type TransactionProgress =
  | { status: "idle" }
  | { status: "confirming" }
  | { status: "submitted"; hash: string }
  | { status: "confirmed"; hash: string; blockNumber: number }
  | { status: "error"; message: string }
  | { status: "cancelled" };

export async function executeContractTransaction(
  sendTransaction: () => Promise<ContractTransactionResponse>,
  onProgress?: (progress: TransactionProgress) => void,
): Promise<TransactionReceipt> {
  onProgress?.({ status: "confirming" });

  try {
    const response = await sendTransaction();
    onProgress?.({ status: "submitted", hash: response.hash });

    const receipt = await response.wait();

    if (!receipt) {
      const message = "Transaction reverted by the smart contract.";
      onProgress?.({ status: "error", message });
      throw new Error(message);
    }

    onProgress?.({
      status: "confirmed",
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });

    return receipt;
  } catch (error) {
    const message = getSafeBlockchainErrorMessage(error);

    if (message === "Transaction cancelled.") {
      onProgress?.({ status: "cancelled" });
    } else {
      onProgress?.({ status: "error", message });
    }

    throw new Error(message);
  }
}
