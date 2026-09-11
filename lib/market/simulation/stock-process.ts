import {
  MAX_LOG_RETURN,
  MEAN_REVERSION_STRENGTH,
  MIN_PRICE,
  MOMENTUM_STRENGTH,
  ROLLING_WINDOW,
  VOLATILITY_MULTIPLIER,
} from "./config";
import type {
  StockSimulationState,
  VolatilityRegime,
} from "./types";
import type { SeededRandom } from "./random";

function clampLogReturn(value: number, regime: VolatilityRegime): number {
  const max = MAX_LOG_RETURN[regime];
  return Math.max(-max, Math.min(max, value));
}

function computeMomentum(rollingReturns: number[]): number {
  if (rollingReturns.length === 0) {
    return 0;
  }

  const recent = rollingReturns.slice(-5);
  const avg = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  return avg * MOMENTUM_STRENGTH;
}

function computeMeanReversion(price: number, referencePrice: number): number {
  if (referencePrice <= 0) {
    return 0;
  }

  const deviation = Math.log(price / referencePrice);
  return -deviation * MEAN_REVERSION_STRENGTH;
}

export function computeStockLogReturn(
  stock: StockSimulationState,
  marketReturn: number,
  sectorReturn: number,
  volatilityRegime: VolatilityRegime,
  sessionVolatilityBoost: number,
  rng: SeededRandom,
): number {
  const volMultiplier =
    VOLATILITY_MULTIPLIER[volatilityRegime] * (1 + sessionVolatilityBoost);

  const idiosyncratic =
    rng.nextGaussian() * stock.baseVolatility * volMultiplier;

  const momentum = computeMomentum(stock.rollingReturns);
  const meanReversion = computeMeanReversion(stock.price, stock.referencePrice);

  const raw =
    stock.alpha +
    stock.beta * marketReturn +
    stock.sectorBeta * sectorReturn +
    momentum +
    meanReversion +
    idiosyncratic;

  return clampLogReturn(raw, volatilityRegime);
}

export function applyLogReturn(price: number, logReturn: number): number {
  const next = price * Math.exp(logReturn);
  return Math.max(MIN_PRICE, Math.round(next * 100) / 100);
}

export function updateRollingReturns(
  rollingReturns: number[],
  logReturn: number,
): number[] {
  const next = [...rollingReturns, logReturn];
  if (next.length > ROLLING_WINDOW) {
    next.shift();
  }
  return next;
}

export function computeRollingVolatility(rollingReturns: number[]): number {
  if (rollingReturns.length < 2) {
    return 0.01;
  }

  const mean =
    rollingReturns.reduce((sum, value) => sum + value, 0) / rollingReturns.length;
  const variance =
    rollingReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    rollingReturns.length;

  return Math.sqrt(variance);
}

export function createInitialStockState(
  input: {
    symbol: string;
    sector: string;
    price: number;
    previousClose: number;
    beta: number;
    sectorBeta: number;
    baseVolatility: number;
    volume?: number;
  },
): StockSimulationState {
  const price = Math.max(MIN_PRICE, input.price);

  return {
    symbol: input.symbol,
    sector: input.sector,
    beta: input.beta,
    sectorBeta: input.sectorBeta,
    alpha: 0,
    baseVolatility: input.baseVolatility,
    price,
    previousClose: input.previousClose,
    dayOpen: price,
    dayHigh: price,
    dayLow: price,
    volume: input.volume ?? 0,
    referencePrice: price,
    rollingReturns: [],
    rollingVolatility: input.baseVolatility,
    lastReturn: 0,
  };
}
