import { z } from "zod";

export const walletPasswordSchema = z
  .string()
  .min(8, "Wallet password must be at least 8 characters.")
  .max(128, "Wallet password must be at most 128 characters.");

export const walletPasswordFormSchema = z
  .object({
    password: walletPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your wallet password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Wallet passwords do not match.",
    path: ["confirmPassword"],
  });

export const importMnemonicSchema = z.object({
  mnemonic: z
    .string()
    .trim()
    .min(1, "Recovery phrase is required."),
  password: walletPasswordSchema,
  confirmPassword: z.string().min(1, "Please confirm your wallet password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wallet passwords do not match.",
  path: ["confirmPassword"],
});

export const unlockWalletSchema = z.object({
  password: z.string().min(1, "Wallet password is required."),
});

export const importPrivateKeySchema = z.object({
  privateKey: z.string().trim().min(1, "Private key is required."),
  password: walletPasswordSchema,
  confirmPassword: z.string().min(1, "Please confirm your wallet password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wallet passwords do not match.",
  path: ["confirmPassword"],
});
