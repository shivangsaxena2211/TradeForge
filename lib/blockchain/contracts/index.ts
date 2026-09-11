import addresses from "./addresses.local.json";
import stockAbiFile from "./abis/Stock.json";
import userAbiFile from "./abis/User.json";

export type LocalContractAddresses = {
  chainId: number;
  networkName: string;
  user: string;
  stock: string;
  deployedAt: string;
};

export const localContractAddresses = addresses as LocalContractAddresses;

export const userContractAbi = userAbiFile.abi;
export const stockContractAbi = stockAbiFile.abi;

export const PRECISION = {
  /** 1 virtual-cash unit = ₹0.01 (1 paise). */
  virtualCashUnitPaise: 1,
  /** 1 whole share = 10^8 quantity units. */
  quantityScale: 100_000_000,
} as const;
