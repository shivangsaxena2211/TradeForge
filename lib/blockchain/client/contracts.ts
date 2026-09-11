import { Contract, type ContractRunner } from "ethers";

import {
  localContractAddresses,
  stockContractAbi,
  userContractAbi,
} from "../contracts";

import { BlockchainClientError } from "./errors";

export function assertContractsDeployed(): void {
  if (!localContractAddresses.user || !localContractAddresses.stock) {
    throw new BlockchainClientError(
      "CONTRACT_NOT_DEPLOYED",
      "Smart contracts are not deployed. Run npm run blockchain:deploy.",
    );
  }
}

export function getUserContract(runner: ContractRunner): Contract {
  assertContractsDeployed();

  return new Contract(
    localContractAddresses.user,
    userContractAbi,
    runner,
  );
}

export function getStockContract(runner: ContractRunner): Contract {
  assertContractsDeployed();

  return new Contract(
    localContractAddresses.stock,
    stockContractAbi,
    runner,
  );
}
