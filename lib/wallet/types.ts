import type { HDNodeWallet, Wallet } from "ethers";

import { blockchainConfig } from "@/lib/blockchain/config";

export const DEFINN_WALLET_TYPE = "DEFINN_CUSTOM" as const;

export const DEFINN_NETWORK_LABEL = blockchainConfig.networkName;

export const KEYSTORE_STORAGE_PREFIX = "definn:keystore:v1:";

export type WalletMetadataRecord = {
  address: string;
  walletType: typeof DEFINN_WALLET_TYPE;
  createdAt: string;
};

export type EthersWallet = HDNodeWallet | Wallet;

export type WalletErrorCode =
  | "INVALID_MNEMONIC"
  | "INVALID_PRIVATE_KEY"
  | "INVALID_PASSWORD"
  | "ENCRYPTION_FAILED"
  | "DECRYPTION_FAILED"
  | "KEYSTORE_NOT_FOUND"
  | "WALLET_EXISTS"
  | "WALLET_NOT_FOUND"
  | "ADDRESS_MISMATCH"
  | "INVALID_ADDRESS";

export class WalletError extends Error {
  readonly code: WalletErrorCode;

  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

export type CreatedWalletResult = {
  address: string;
  mnemonic: string;
};

export type EncryptedKeystore = {
  encryptedJson: string;
  address: string;
};
