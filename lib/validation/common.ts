import { z } from "zod";

export const uuidParamSchema = z.string().uuid("Invalid resource identifier.");

export const ethereumAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address.");

export const transactionHashSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash.");
