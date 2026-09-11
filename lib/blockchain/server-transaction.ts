import "server-only";

import { blockchainConfig } from "./config";
import { getBlockchainProvider } from "./provider";
import { isBlockchainConnected } from "./status";

export type OnChainTransactionVerification = {
  blockchainConnected: boolean;
  foundOnChain: boolean;
  historicalOnly: boolean;
  from: string | null;
  to: string | null;
  blockNumber: number | null;
  chainId: number;
  blockTimestamp: number | null;
  receiptStatus: "success" | "reverted" | "unknown" | null;
  message: string | null;
};

export async function verifyTransactionOnChain(
  txHash: string,
): Promise<OnChainTransactionVerification> {
  const disconnected: OnChainTransactionVerification = {
    blockchainConnected: false,
    foundOnChain: false,
    historicalOnly: false,
    from: null,
    to: null,
    blockNumber: null,
    chainId: blockchainConfig.chainId,
    blockTimestamp: null,
    receiptStatus: null,
    message: "Blockchain currently unavailable.",
  };

  if (!(await isBlockchainConnected())) {
    return disconnected;
  }

  try {
    const provider = getBlockchainProvider();
    const [transaction, receipt] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
    ]);

    if (!transaction && !receipt) {
      return {
        blockchainConnected: true,
        foundOnChain: false,
        historicalOnly: true,
        from: null,
        to: null,
        blockNumber: null,
        chainId: blockchainConfig.chainId,
        blockTimestamp: null,
        receiptStatus: null,
        message:
          "This transaction is not present on the current local blockchain state.",
      };
    }

    const blockNumber = receipt?.blockNumber ?? transaction?.blockNumber ?? null;
    let blockTimestamp: number | null = null;

    if (blockNumber !== null) {
      const block = await provider.getBlock(blockNumber);
      blockTimestamp = block?.timestamp ?? null;
    }

    return {
      blockchainConnected: true,
      foundOnChain: true,
      historicalOnly: false,
      from: transaction?.from ?? null,
      to: transaction?.to ?? null,
      blockNumber,
      chainId: Number(transaction?.chainId ?? blockchainConfig.chainId),
      blockTimestamp,
      receiptStatus:
        receipt === null
          ? "unknown"
          : receipt.status === 1
            ? "success"
            : "reverted",
      message: null,
    };
  } catch (error) {
    console.error("On-chain transaction verification failed:", error);

    return {
      blockchainConnected: true,
      foundOnChain: false,
      historicalOnly: false,
      from: null,
      to: null,
      blockNumber: null,
      chainId: blockchainConfig.chainId,
      blockTimestamp: null,
      receiptStatus: null,
      message: "Unable to verify transaction on the current local blockchain.",
    };
  }
}
