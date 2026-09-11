import type { OnChainStockQuote } from "./types";
import { shareInputToUnits } from "./precision";

export type TradeValidationResult =
  | { valid: true; quantityUnits: bigint }
  | { valid: false; message: string };

export function validateTradeQuantityInput(quantityInput: string): TradeValidationResult {
  const quantityUnits = shareInputToUnits(quantityInput);

  if (!quantityUnits) {
    return {
      valid: false,
      message: "Quantity must be greater than zero with up to 8 decimal places.",
    };
  }

  return { valid: true, quantityUnits };
}

export function validateBuyPreTradeUx(
  onChainStock: OnChainStockQuote | null,
  quantityUnits: bigint,
  virtualCashPaise: bigint,
  estimatedCostPaise: bigint,
): string | null {
  if (!onChainStock) {
    return "Blockchain is unavailable.";
  }

  if (!onChainStock.active) {
    return "Stock is inactive on-chain.";
  }

  if (virtualCashPaise < estimatedCostPaise) {
    return "Insufficient on-chain virtual cash for this purchase.";
  }

  if (quantityUnits <= BigInt(0)) {
    return "Quantity must be greater than zero.";
  }

  return null;
}

export function validateSellPreTradeUx(
  onChainStock: OnChainStockQuote | null,
  quantityUnits: bigint,
  holdingUnits: bigint,
): string | null {
  if (!onChainStock) {
    return "Blockchain is unavailable.";
  }

  if (!onChainStock.active) {
    return "Stock is inactive on-chain.";
  }

  if (holdingUnits < quantityUnits) {
    return "Insufficient on-chain shares for this sale.";
  }

  return null;
}
