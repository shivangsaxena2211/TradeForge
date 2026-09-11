import "server-only";

import { getPrismaClient } from "@/lib/db/client";

import { normalizeSymbol } from "./search";

export async function findStockBySymbol(
  symbol: string,
  exchange = "NSE",
) {
  const prisma = getPrismaClient();
  const normalized = normalizeSymbol(symbol);

  return prisma.stock.findUnique({
    where: {
      exchange_symbol: {
        exchange: exchange.toUpperCase(),
        symbol: normalized,
      },
    },
  });
}

export async function findStockBySymbolOrFirst(symbol: string) {
  const prisma = getPrismaClient();
  const normalized = normalizeSymbol(symbol);

  const exact = await prisma.stock.findFirst({
    where: { symbol: normalized },
    orderBy: { exchange: "asc" },
  });

  return exact;
}
