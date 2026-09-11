"use server";

import { getAddress, isAddress } from "ethers";

import { requireAuth } from "@/lib/auth/session";
import { getPrismaClient } from "@/lib/db";

type RegisterWalletResult =
  | { success: true; address: string }
  | { success: false; error: string; code?: string };

export async function registerWalletAddress(
  address: string,
): Promise<RegisterWalletResult> {
  const user = await requireAuth();

  if (!isAddress(address)) {
    return {
      success: false,
      error: "Invalid wallet address.",
      code: "INVALID_ADDRESS",
    };
  }

  const normalizedAddress = getAddress(address);
  const prisma = getPrismaClient();

  try {
    const existingUserWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (existingUserWallet) {
      return {
        success: false,
        error: "A wallet already exists for this account.",
        code: "WALLET_EXISTS",
      };
    }

    const existingAddress = await prisma.wallet.findUnique({
      where: { address: normalizedAddress },
      select: { id: true },
    });

    if (existingAddress) {
      return {
        success: false,
        error: "This wallet address is already registered.",
        code: "WALLET_EXISTS",
      };
    }

    await prisma.wallet.create({
      data: {
        userId: user.id,
        address: normalizedAddress,
        walletType: "DEFINN_CUSTOM",
      },
    });

    return { success: true, address: normalizedAddress };
  } catch (error) {
    console.error("Wallet registration failed:", error);

    return {
      success: false,
      error: "Could not save wallet metadata. Please try again later.",
    };
  }
}

export async function replaceWalletAddress(
  address: string,
  confirmReplace: boolean,
): Promise<RegisterWalletResult> {
  const user = await requireAuth();

  if (!confirmReplace) {
    return {
      success: false,
      error: "Wallet replacement requires explicit confirmation.",
    };
  }

  if (!isAddress(address)) {
    return {
      success: false,
      error: "Invalid wallet address.",
      code: "INVALID_ADDRESS",
    };
  }

  const normalizedAddress = getAddress(address);
  const prisma = getPrismaClient();

  try {
    const existingUserWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { id: true, address: true },
    });

    if (!existingUserWallet) {
      return registerWalletAddress(normalizedAddress);
    }

    if (existingUserWallet.address === normalizedAddress) {
      return { success: true, address: normalizedAddress };
    }

    const addressTaken = await prisma.wallet.findFirst({
      where: {
        address: normalizedAddress,
        userId: { not: user.id },
      },
      select: { id: true },
    });

    if (addressTaken) {
      return {
        success: false,
        error: "This wallet address is already registered to another account.",
        code: "WALLET_EXISTS",
      };
    }

    await prisma.wallet.update({
      where: { userId: user.id },
      data: { address: normalizedAddress },
    });

    return { success: true, address: normalizedAddress };
  } catch (error) {
    console.error("Wallet replacement failed:", error);

    return {
      success: false,
      error: "Could not update wallet metadata. Please try again later.",
    };
  }
}
