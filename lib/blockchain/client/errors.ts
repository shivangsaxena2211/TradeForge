export type BlockchainClientErrorCode =
  | "WALLET_LOCKED"
  | "WRONG_NETWORK"
  | "BLOCKCHAIN_UNAVAILABLE"
  | "ADDRESS_MISMATCH"
  | "CONTRACT_NOT_DEPLOYED"
  | "TRANSACTION_REJECTED"
  | "TRANSACTION_REVERTED"
  | "TRANSACTION_CANCELLED"
  | "ALREADY_REGISTERED"
  | "UNKNOWN";

export class BlockchainClientError extends Error {
  readonly code: BlockchainClientErrorCode;

  constructor(code: BlockchainClientErrorCode, message: string) {
    super(message);
    this.name = "BlockchainClientError";
    this.code = code;
  }
}

export function getSafeBlockchainErrorMessage(error: unknown): string {
  if (error instanceof BlockchainClientError) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      code?: string | number;
      reason?: string;
      shortMessage?: string;
      message?: string;
    };

    if (candidate.code === "ACTION_REJECTED" || candidate.code === 4001) {
      return "Transaction cancelled.";
    }

    if (candidate.reason === "reverted" || candidate.code === "CALL_EXCEPTION") {
      return (
        mapContractRevertMessage(
          candidate.shortMessage ?? candidate.message ?? "",
        ) ??
        "Trade could not be completed because the transaction was rejected by the smart contract."
      );
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("user rejected") || message.includes("denied")) {
      return "Transaction cancelled.";
    }

    if (message.includes("network") && message.includes("chain")) {
      return "Wrong blockchain network.";
    }

    if (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("econnrefused")
    ) {
      return "Blockchain is unavailable.";
    }

    const mapped = mapContractRevertMessage(error.message);
    if (mapped) {
      return mapped;
    }
  }

  return "Transaction failed. Please try again.";
}

function mapContractRevertMessage(message: string): string | null {
  const normalized = message.toLowerCase();

  if (normalized.includes("insufficientvirtualcash")) {
    return "Trade could not be completed because on-chain virtual cash is insufficient.";
  }

  if (normalized.includes("insufficientholding")) {
    return "Trade could not be completed because on-chain share holdings are insufficient.";
  }

  if (normalized.includes("usernotregistered")) {
    return "Wallet is not registered on the blockchain.";
  }

  if (normalized.includes("stockinactive")) {
    return "Stock is inactive on-chain.";
  }

  if (normalized.includes("zeroquantity")) {
    return "Quantity must be greater than zero.";
  }

  if (normalized.includes("invalidstockid")) {
    return "On-chain stock is unavailable.";
  }

  if (
    normalized.includes("reverted") ||
    normalized.includes("execution reverted")
  ) {
    return "Trade could not be completed because the transaction was rejected by the smart contract.";
  }

  return null;
}
