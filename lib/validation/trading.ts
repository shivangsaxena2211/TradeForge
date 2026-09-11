import { z } from "zod";

export const createOrderSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9._-]+$/),
  side: z.enum(["BUY", "SELL"]),
  quantity: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,8})?$/, "Enter a valid share quantity."),
  onChainStockId: z.number().int().positive(),
  requestedPricePaise: z.string().regex(/^\d+$/),
  quantityUnits: z.string().regex(/^\d+$/),
});

export const syncOrderSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});
