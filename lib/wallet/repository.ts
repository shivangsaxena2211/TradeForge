import { getPrismaClient } from "@/lib/db";

export async function getWalletByUserId(userId: string) {
  const prisma = getPrismaClient();

  return prisma.wallet.findUnique({
    where: { userId },
    select: {
      address: true,
      walletType: true,
      createdAt: true,
    },
  });
}
