import type { SeededRandom } from "./random";

export function generateSectorReturns(
  sectors: string[],
  marketReturn: number,
  volatilityMultiplier: number,
  rng: SeededRandom,
): Record<string, number> {
  const returns: Record<string, number> = {};

  for (const sector of sectors) {
    const idiosyncratic = rng.nextGaussian() * 0.003 * volatilityMultiplier;
    const sectorMarketLink = marketReturn * (0.6 + rng.next() * 0.3);
    returns[sector] = sectorMarketLink + idiosyncratic;
  }

  return returns;
}

export function getUniqueSectors(
  stocks: Array<{ sector: string }>,
): string[] {
  return [...new Set(stocks.map((stock) => stock.sector))];
}
