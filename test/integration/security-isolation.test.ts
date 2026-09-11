import "dotenv/config";

import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getPrismaClient } from "@/lib/db/client";
import { getOrderDetailForUser } from "@/lib/trading/service";
import { getTransactionDetailForUser } from "@/lib/transactions/service";

let databaseAvailable = false;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    return;
  }

  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    databaseAvailable = true;
  } catch {
    databaseAvailable = false;
  }
});

describe("user isolation (integration)", () => {
  it("does not return another user's order by ID", async () => {
    if (!databaseAvailable) {
      return;
    }

    const prisma = getPrismaClient();

    const [userA, userB] = await Promise.all([
      prisma.user.upsert({
        where: { email: "isolation-a@definn.local" },
        update: {},
        create: {
          email: "isolation-a@definn.local",
          username: "isolation-a",
          passwordHash: "test-only",
        },
      }),
      prisma.user.upsert({
        where: { email: "isolation-b@definn.local" },
        update: {},
        create: {
          email: "isolation-b@definn.local",
          username: "isolation-b",
          passwordHash: "test-only",
        },
      }),
    ]);

    const stock = await prisma.stock.findFirst();

    if (!stock) {
      return;
    }

    const orderB = await prisma.order.create({
      data: {
        userId: userB.id,
        stockId: stock.id,
        side: "BUY",
        orderType: "MARKET",
        quantity: "1.00000000",
        requestedPrice: "250.00",
        status: "PENDING",
      },
    });

    const leaked = await getOrderDetailForUser(userA.id, orderB.id);
    expect(leaked).toBeNull();
  });

  it("does not return another user's transaction by ID", async () => {
    if (!databaseAvailable) {
      return;
    }

    const prisma = getPrismaClient();

    const [userA, userB] = await Promise.all([
      prisma.user.findUnique({ where: { email: "isolation-a@definn.local" } }),
      prisma.user.findUnique({ where: { email: "isolation-b@definn.local" } }),
    ]);

    if (!userA || !userB) {
      return;
    }

    const uniqueSuffix = Date.now().toString(16).padStart(12, "0");
    const txB = await prisma.transaction.create({
      data: {
        userId: userB.id,
        transactionType: "STOCK_BUY",
        status: "CONFIRMED",
        txHash: `0x${uniqueSuffix}${"b".repeat(52)}`,
      },
    });

    const leaked = await getTransactionDetailForUser(userA.id, txB.id);
    expect(leaked).toBeNull();
  });
});
