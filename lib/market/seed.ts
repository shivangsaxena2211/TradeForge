import { getPrismaClient } from "@/lib/db/client";
import type { PriceHistorySource } from "@/lib/generated/prisma/client";

import { roundCurrency } from "./calculations";
import { createSeededRandom } from "./simulation/random";

function generateSeedHistoricalPrices(
  symbol: string,
  targetPrice: number,
  points: number,
): number[] {
  const rng = createSeededRandom(symbol.length * 1000 + Math.round(targetPrice * 100));
  const prices: number[] = [];
  let price = targetPrice;

  for (let tick = points; tick >= 0; tick -= 1) {
    prices.unshift(roundCurrency(price));

    if (tick > 0) {
      const shock = rng.nextGaussian() * 0.008;
      price = Math.max(0.01, roundCurrency(price / Math.exp(shock)));
    }
  }

  return prices;
}

export async function seedPriceHistoryForStock(
  stockId: string,
  symbol: string,
  currentPrice: number,
  points = 30,
  sourceType: PriceHistorySource = "HISTORICAL",
): Promise<void> {
  const prisma = getPrismaClient();
  const existingCount = await prisma.priceHistory.count({
    where: { stockId, sourceType },
  });

  if (existingCount > 0) {
    return;
  }

  const prices = generateSeedHistoricalPrices(symbol, currentPrice, points);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  await prisma.priceHistory.createMany({
    data: prices.map((price, index) => {
      const open = price;
      const close = price;
      const high = roundCurrency(price * 1.005);
      const low = roundCurrency(price * 0.995);

      return {
        stockId,
        price: close.toFixed(2),
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: BigInt(50_000 + index * 100),
        sourceType,
        timestamp: new Date(now - (prices.length - index - 1) * dayMs),
      };
    }),
  });
}
