import { Wallet } from "ethers";

import type { EthersWallet } from "./types";
import { WalletError } from "./types";

export async function encryptWallet(
  wallet: EthersWallet | Wallet,
  password: string,
): Promise<string> {
  try {
    return await wallet.encrypt(password);
  } catch {
    throw new WalletError(
      "ENCRYPTION_FAILED",
      "Could not encrypt the wallet. Please try again.",
    );
  }
}

export async function decryptWallet(
  encryptedJson: string,
  password: string,
): Promise<EthersWallet> {
  try {
    const wallet = await Wallet.fromEncryptedJson(encryptedJson, password);
    return wallet;
  } catch {
    throw new WalletError(
      "DECRYPTION_FAILED",
      "Incorrect wallet password or corrupted wallet data.",
    );
  }
}
