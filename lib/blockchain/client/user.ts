import type { ContractRunner, Signer, TransactionReceipt } from "ethers";

import { getUserContract } from "./contracts";
import { BlockchainClientError } from "./errors";
import { getClientProvider } from "./provider";

export async function isUserRegistered(
  address: string,
  runner?: ContractRunner,
): Promise<boolean> {
  const contract = getUserContract(runner ?? getClientProvider());
  return contract.isRegistered(address) as Promise<boolean>;
}

export async function registerUser(
  signer: Signer,
): Promise<TransactionReceipt> {
  const address = await signer.getAddress();
  const readContract = getUserContract(signer.provider!);
  const alreadyRegistered = await readContract.isRegistered(address);

  if (alreadyRegistered) {
    throw new BlockchainClientError(
      "ALREADY_REGISTERED",
      "Wallet already registered.",
    );
  }

  const writeContract = getUserContract(signer);
  const response = await writeContract.register();
  const receipt = await response.wait();

  if (!receipt) {
    throw new BlockchainClientError(
      "TRANSACTION_REVERTED",
      "Transaction reverted by the smart contract.",
    );
  }

  return receipt;
}
