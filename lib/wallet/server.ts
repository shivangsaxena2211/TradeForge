import "server-only";

import { requireAuth } from "@/lib/auth/session";
import { getPrismaClient } from "@/lib/db";

import { getWalletByUserId } from "./repository";
import { DEFINN_WALLET_TYPE } from "./types";

export type WalletMetadataResponse = {
  address: string;
  walletType: typeof DEFINN_WALLET_TYPE;
  createdAt: string;
} | null;

export { getWalletByUserId };

export async function getWalletMetadata(): Promise<WalletMetadataResponse> {
  const user = await requireAuth();
  const prisma = getPrismaClient();

  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    select: {
      address: true,
      walletType: true,
      createdAt: true,
    },
  });

  if (!wallet) {
    return null;
  }

  return {
    address: wallet.address,
    walletType: DEFINN_WALLET_TYPE,
    createdAt: wallet.createdAt.toISOString(),
  };
}
