import { Contract, JsonRpcProvider } from "ethers";

import { stockContractAbi } from "@/lib/blockchain/contracts";

export type DeployedContractAddresses = {
  stock: string;
  user: string;
};

export async function areLocalContractsDeployed(
  provider: JsonRpcProvider,
  addresses: DeployedContractAddresses,
): Promise<boolean> {
  const [stockCode, userCode] = await Promise.all([
    provider.getCode(addresses.stock),
    provider.getCode(addresses.user),
  ]);

  if (stockCode === "0x" || userCode === "0x") {
    return false;
  }

  try {
    const stock = new Contract(addresses.stock, stockContractAbi, provider);
    await stock.stockCount();
    return true;
  } catch {
    return false;
  }
}
