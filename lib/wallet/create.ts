import { Wallet } from "ethers";

import type { CreatedWalletResult } from "./types";

/**
 * Generate a new Ethereum-compatible wallet using ethers.js.
 * Mnemonic is returned only for explicit user-facing creation flows.
 */
export function createNewWallet(): CreatedWalletResult {
  const wallet = Wallet.createRandom();
  const mnemonic = wallet.mnemonic?.phrase;

  if (!mnemonic) {
    throw new Error("Wallet mnemonic generation failed.");
  }

  return {
    address: wallet.address,
    mnemonic,
  };
}

/**
 * Reconstruct a wallet from mnemonic to verify address derivation.
 */
export function walletFromMnemonic(mnemonic: string) {
  const normalized = normalizeMnemonic(mnemonic);
  return Wallet.fromPhrase(normalized);
}

export function normalizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getAddressFromMnemonic(mnemonic: string): string {
  return walletFromMnemonic(mnemonic).address;
}
