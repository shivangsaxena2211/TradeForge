import { BlockchainClientError } from "./errors";

export function assertWalletAddressMatch(
  databaseAddress: string,
  unlockedAddress: string,
): void {
  if (databaseAddress.toLowerCase() !== unlockedAddress.toLowerCase()) {
    throw new BlockchainClientError(
      "ADDRESS_MISMATCH",
      "Unlocked wallet does not match the wallet registered to this account.",
    );
  }
}
