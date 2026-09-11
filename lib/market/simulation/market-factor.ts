import { MARKET_REGIME_DRIFT } from "./config";
import type { MarketRegime } from "./types";
import type { SeededRandom } from "./random";

export function generateMarketReturn(
  regime: MarketRegime,
  volatilityMultiplier: number,
  rng: SeededRandom,
): number {
  const drift = MARKET_REGIME_DRIFT[regime];
  const shock = rng.nextGaussian() * 0.004 * volatilityMultiplier;
  return drift + shock;
}
