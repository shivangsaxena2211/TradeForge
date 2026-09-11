import { MIN_PRICE } from "./config";
import type { OhlcvCandle } from "./types";
import type { SeededRandom } from "./random";

export function generateIntradayCandle(
  previousClose: number,
  logReturn: number,
  baseVolume: number,
  absReturn: number,
  volatilityBoost: number,
  rng: SeededRandom,
): OhlcvCandle {
  const open = Math.max(MIN_PRICE, previousClose);
  const close = Math.max(MIN_PRICE, Math.round(open * Math.exp(logReturn) * 100) / 100);

  const intradayNoise = Math.abs(rng.nextGaussian()) * 0.003 * (1 + volatilityBoost);
  const high = Math.max(open, close) * (1 + intradayNoise);
  const low = Math.min(open, close) * (1 - intradayNoise);

  const volumeMultiplier =
    1 + absReturn * 80 + volatilityBoost * 0.5 + rng.next() * 0.3;
  const volume = Math.max(
    0,
    Math.round(baseVolume * volumeMultiplier * (0.8 + rng.next() * 0.4)),
  );

  return {
    open: Math.round(open * 100) / 100,
    high: Math.round(Math.max(high, open, close) * 100) / 100,
    low: Math.round(Math.min(low, open, close) * 100) / 100,
    close,
    volume,
  };
}

export function validateOhlcv(candle: OhlcvCandle): void {
  if (candle.open <= 0 || candle.close <= 0 || candle.high <= 0 || candle.low <= 0) {
    throw new Error("OHLCV prices must be positive.");
  }

  if (candle.high < Math.max(candle.open, candle.close)) {
    throw new Error("OHLCV high must be >= max(open, close).");
  }

  if (candle.low > Math.min(candle.open, candle.close)) {
    throw new Error("OHLCV low must be <= min(open, close).");
  }

  if (candle.volume < 0) {
    throw new Error("Volume must be non-negative.");
  }
}
