import { formatEther } from "ethers";

/**
 * Format a wei balance for display (e.g. "0.0000 ETH").
 */
export function formatNativeBalance(balanceWei: bigint): string {
  const eth = formatEther(balanceWei);
  const numeric = Number(eth);

  if (!Number.isFinite(numeric)) {
    return "0.0000 ETH";
  }

  return `${numeric.toFixed(4)} ETH`;
}
