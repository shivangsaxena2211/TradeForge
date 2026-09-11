import { z } from "zod";

export const transactionListQuerySchema = z.object({
  status: z
    .enum(["ALL", "CONFIRMED", "FAILED", "PENDING"])
    .optional()
    .default("ALL"),
  type: z
    .enum(["ALL", "STOCK_BUY", "STOCK_SELL"])
    .optional()
    .default("ALL"),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
