import type { EthersWallet } from "@/lib/wallet/types";

import { validateChainId } from "./chain";
import { getClientProvider } from "./provider";

/**
 * Connect an unlocked DEFINN wallet to the local JSON-RPC provider.
 * The signer exists only in memory and must be cleared when the wallet locks.
 */
export async function createConnectedSigner(wallet: EthersWallet) {
  const provider = getClientProvider();
  await validateChainId(provider);
  return wallet.connect(provider);
}
