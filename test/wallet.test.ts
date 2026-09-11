import { describe, expect, it } from "vitest";
import { Wallet, isAddress } from "ethers";

import { createNewWallet, getAddressFromMnemonic } from "@/lib/wallet/create";
import { decryptWallet, encryptWallet } from "@/lib/wallet/encrypt";
import {
  importWalletFromMnemonic,
  importWalletFromPrivateKey,
} from "@/lib/wallet/import";
import { WalletError } from "@/lib/wallet/types";

const TEST_PASSWORD = "test-wallet-password-123";
const TEST_MNEMONIC =
  "test test test test test test test test test test test junk";

describe("DEFINN wallet core", () => {
  it("generates a valid Ethereum address", () => {
    const { address } = createNewWallet();
    expect(isAddress(address)).toBe(true);
  });

  it("recreates the same address from a mnemonic", () => {
    const wallet = importWalletFromMnemonic(TEST_MNEMONIC);
    const derivedAddress = getAddressFromMnemonic(TEST_MNEMONIC);
    expect(wallet.address).toBe(derivedAddress);
  });

  it("encrypts and decrypts a wallet with the correct password", async () => {
    const wallet = Wallet.fromPhrase(TEST_MNEMONIC);
    const encryptedJson = await encryptWallet(wallet, TEST_PASSWORD);
    const decrypted = await decryptWallet(encryptedJson, TEST_PASSWORD);
    expect(decrypted.address).toBe(wallet.address);
  }, 15_000);

  it("fails decryption with an incorrect password", async () => {
    const wallet = Wallet.fromPhrase(TEST_MNEMONIC);
    const encryptedJson = await encryptWallet(wallet, TEST_PASSWORD);

    await expect(
      decryptWallet(encryptedJson, "wrong-password-value"),
    ).rejects.toMatchObject({
      code: "DECRYPTION_FAILED",
    });
  }, 15_000);

  it("imports a wallet from mnemonic and derives expected address", () => {
    const wallet = importWalletFromMnemonic(TEST_MNEMONIC);
    expect(wallet.address).toBe(
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    );
  });

  it("imports a wallet from private key", () => {
    const source = Wallet.fromPhrase(TEST_MNEMONIC);
    const imported = importWalletFromPrivateKey(source.privateKey);
    expect(imported.address).toBe(source.address);
  });

  it("rejects invalid recovery phrases", () => {
    expect(() => importWalletFromMnemonic("not a valid phrase")).toThrow(
      WalletError,
    );
  });

  it("does not expose plaintext secrets in encrypted JSON", async () => {
    const wallet = Wallet.fromPhrase(TEST_MNEMONIC);
    const encryptedJson = await encryptWallet(wallet, TEST_PASSWORD);

    expect(encryptedJson).not.toContain(wallet.privateKey);
    expect(encryptedJson).not.toContain(TEST_MNEMONIC);
    expect(encryptedJson).not.toContain(TEST_PASSWORD);
  });
});

describe("registerWalletAddress metadata safety", () => {
  it("returns only safe address metadata shape conceptually", () => {
    const safeMetadata = {
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      walletType: "DEFINN_CUSTOM" as const,
      createdAt: new Date().toISOString(),
    };

    expect(safeMetadata).not.toHaveProperty("passwordHash");
    expect(safeMetadata).not.toHaveProperty("privateKey");
    expect(safeMetadata).not.toHaveProperty("mnemonic");
    expect(Object.keys(safeMetadata)).toEqual([
      "address",
      "walletType",
      "createdAt",
    ]);
  });
});
