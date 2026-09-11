import type { MarketRegime, VolatilityRegime } from "./types";
import type { SeededRandom } from "./random";

const MARKET_TRANSITIONS: Record<
  MarketRegime,
  Partial<Record<MarketRegime, number>>
> = {
  NEUTRAL: { BULL: 0.08, BEAR: 0.08, HIGH_VOLATILITY: 0.04, NEUTRAL: 0.8 },
  BULL: { NEUTRAL: 0.15, BEAR: 0.05, HIGH_VOLATILITY: 0.05, BULL: 0.75 },
  BEAR: { NEUTRAL: 0.15, BULL: 0.05, HIGH_VOLATILITY: 0.05, BEAR: 0.75 },
  HIGH_VOLATILITY: {
    NEUTRAL: 0.25,
    BULL: 0.1,
    BEAR: 0.1,
    HIGH_VOLATILITY: 0.55,
  },
};

const VOL_TRANSITIONS: Record<
  VolatilityRegime,
  Partial<Record<VolatilityRegime, number>>
> = {
  LOW: { NORMAL: 0.12, LOW: 0.88 },
  NORMAL: { LOW: 0.08, HIGH: 0.1, NORMAL: 0.82 },
  HIGH: { NORMAL: 0.2, EXTREME: 0.05, HIGH: 0.75 },
  EXTREME: { HIGH: 0.35, NORMAL: 0.1, EXTREME: 0.55 },
};

function pickTransition<T extends string>(
  current: T,
  table: Record<T, Partial<Record<T, number>>>,
  rng: SeededRandom,
): T {
  const options = table[current];
  const roll = rng.next();
  let cumulative = 0;

  for (const [next, probability] of Object.entries(options)) {
    cumulative += probability as number;
    if (roll <= cumulative) {
      return next as T;
    }
  }

  return current;
}

export function maybeTransitionMarketRegime(
  current: MarketRegime,
  rng: SeededRandom,
): MarketRegime {
  if (rng.next() > 0.03) {
    return current;
  }

  return pickTransition(current, MARKET_TRANSITIONS, rng);
}

export function maybeTransitionVolatilityRegime(
  current: VolatilityRegime,
  rng: SeededRandom,
  clusteredVolatility: number,
): VolatilityRegime {
  const baseProbability = 0.04 + Math.min(0.08, clusteredVolatility * 2);

  if (rng.next() > baseProbability) {
    return current;
  }

  return pickTransition(current, VOL_TRANSITIONS, rng);
}

export function updateClusteredVolatility(
  current: number,
  latestAbsReturn: number,
): number {
  const decay = 0.92;
  const shock = Math.min(0.05, latestAbsReturn * 3);
  return current * decay + shock;
}
