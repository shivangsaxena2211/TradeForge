import { PRECISION } from "@/lib/blockchain/contracts";

export const QUANTITY_SCALE = BigInt(PRECISION.quantityScale);

export function shareInputToUnits(input: string): bigint | null {
  const normalized = input.trim();

  if (!/^\d+(\.\d{0,8})?$/.test(normalized)) {
    return null;
  }

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  const paddedFraction = fractionalPart.padEnd(8, "0").slice(0, 8);

  try {
    const units =
      BigInt(wholePart) * QUANTITY_SCALE + BigInt(paddedFraction || "0");

    return units > BigInt(0) ? units : null;
  } catch {
    return null;
  }
}

export function unitsToShareDecimal(units: bigint): string {
  const wholeShares = units / QUANTITY_SCALE;
  const fractionalUnits = units % QUANTITY_SCALE;
  const fractionalString = fractionalUnits.toString().padStart(8, "0");
  return `${wholeShares.toString()}.${fractionalString}`;
}

export function paiseToInrString(paise: bigint): string {
  const rupees = paise / BigInt(100);
  const remainder = paise % BigInt(100);
  return `${rupees.toString()}.${remainder.toString().padStart(2, "0")}`;
}

export function computeTradeValuePaise(pricePaise: bigint, quantityUnits: bigint): bigint {
  return (pricePaise * quantityUnits) / QUANTITY_SCALE;
}
