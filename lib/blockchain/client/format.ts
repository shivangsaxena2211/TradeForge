import { formatInr } from "@/lib/format/currency";

import { PRECISION } from "../contracts";

/**
 * Format simulated virtual cash stored in paise units (1 unit = ₹0.01).
 */
export function formatVirtualCashFromUnits(units: bigint): string {
  const rupees = units / BigInt(100);
  const paise = units % BigInt(100);
  const paiseString = paise.toString().padStart(2, "0");
  const amount = Number(`${rupees}.${paiseString}`);

  return formatInr(amount);
}

/**
 * Format fixed-point share quantity (1 share = 10^8 units).
 */
export function formatShareQuantity(quantityUnits: bigint): string {
  const wholeShares = quantityUnits / BigInt(PRECISION.quantityScale);
  const fractionalUnits =
    quantityUnits % BigInt(PRECISION.quantityScale);
  const fractionalString = fractionalUnits
    .toString()
    .padStart(8, "0")
    .replace(/0+$/, "");

  if (fractionalString.length === 0) {
    return `${wholeShares.toString()}.00000000`;
  }

  const paddedFraction = fractionalString.padEnd(8, "0");
  return `${wholeShares.toString()}.${paddedFraction}`;
}
