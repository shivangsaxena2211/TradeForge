import { z } from "zod";

export const marketSearchSchema = z.object({
  search: z.string().max(100).optional(),
  exchange: z.string().max(20).optional(),
  activeOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  watchlistOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const watchlistSymbolSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required.")
    .max(20, "Symbol is too long.")
    .regex(/^[A-Za-z0-9._&-]+$/, "Invalid stock symbol."),
});

export const priceHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(365).optional().default(30),
  source: z.enum(["historical", "simulated", "all"]).optional().default("all"),
});

export const simulationControlSchema = z.object({
  action: z.enum(["start", "pause", "reset", "speed"]),
  seed: z.number().int().positive().optional(),
  speedMultiplier: z.number().positive().optional(),
});
