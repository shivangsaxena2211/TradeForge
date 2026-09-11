import "server-only";

import { Contract, isAddress } from "ethers";

import { paiseToInrString, unitsToShareDecimal } from "@/lib/trading/precision";

import {
  localContractAddresses,
  stockContractAbi,
} from "./contracts";
import { getBlockchainProvider } from "./provider";
import { isBlockchainConnected } from "./status";

function getStockContract() {
  return new Contract(
    localContractAddresses.stock,
    stockContractAbi,
    getBlockchainProvider(),
  );
}

export async function getServerVirtualCashInr(
  address: string,
): Promise<number | null> {
  if (!isAddress(address) || !(await isBlockchainConnected())) {
    return null;
  }

  try {
    const contract = getStockContract();
    const cashPaise = BigInt(
      (await contract.getVirtualCash(address)).toString(),
    );

    return Number(paiseToInrString(cashPaise));
  } catch (error) {
    console.error("Failed to read on-chain virtual cash:", error);
    return null;
  }
}

export async function getServerOnChainHoldingsBySymbol(
  address: string,
): Promise<Map<string, string> | null> {
  if (!isAddress(address) || !(await isBlockchainConnected())) {
    return null;
  }

  try {
    const contract = getStockContract();
    const stockCount = Number(await contract.stockCount());
    const holdings = new Map<string, string>();

    for (let stockId = 1; stockId <= stockCount; stockId += 1) {
      const quantityUnits = BigInt(
        (await contract.getHolding(address, stockId)).toString(),
      );

      if (quantityUnits === BigInt(0)) {
        continue;
      }

      const stock = await contract.getStock(stockId);
      const symbol = String(stock.symbol).trim().toUpperCase();
      holdings.set(symbol, unitsToShareDecimal(quantityUnits));
    }

    return holdings;
  } catch (error) {
    console.error("Failed to read on-chain holdings:", error);
    return null;
  }
}
