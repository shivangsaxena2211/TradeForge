import { Mnemonic, Wallet } from "ethers";

import { normalizeMnemonic, walletFromMnemonic } from "./create";
import { WalletError } from "./types";

export function importWalletFromMnemonic(mnemonic: string) {
  const normalized = normalizeMnemonic(mnemonic);

  if (!Mnemonic.isValidMnemonic(normalized)) {
    throw new WalletError(
      "INVALID_MNEMONIC",
      "Invalid recovery phrase. Check the words and try again.",
    );
  }

  return walletFromMnemonic(normalized);
}

export function importWalletFromPrivateKey(privateKey: string) {
  const trimmed = privateKey.trim();

  try {
    return new Wallet(trimmed);
  } catch {
    throw new WalletError(
      "INVALID_PRIVATE_KEY",
      "Invalid private key format.",
    );
  }
}
