import type { MarketRegime, VolatilityRegime } from "./types";

/** Default simulation seed for reproducibility */
export const DEFAULT_SIMULATION_SEED = 42;

/** 1 simulated minute = 5 real seconds at 1x speed */
export const DEFAULT_SIM_MINUTE_MS = 5_000;

/** UI refresh interval */
export const UI_TICK_INTERVAL_MS = 5_000;

/** PostgreSQL persistence interval */
export const DB_PERSIST_INTERVAL_MS = 45_000;

/** Simulated candle interval (1 simulated minute) */
export const CANDLE_INTERVAL_MS = 60_000;

/** Rolling window for returns / volatility */
export const ROLLING_WINDOW = 20;

/** Mean reversion strength (weak) */
export const MEAN_REVERSION_STRENGTH = 0.02;

/** Momentum strength (mild) */
export const MOMENTUM_STRENGTH = 0.15;

/** Maximum single-tick log return (safety bound) */
export const MAX_LOG_RETURN: Record<VolatilityRegime, number> = {
  LOW: 0.008,
  NORMAL: 0.015,
  HIGH: 0.028,
  EXTREME: 0.045,
};

/** Volatility regime multipliers */
export const VOLATILITY_MULTIPLIER: Record<VolatilityRegime, number> = {
  LOW: 0.6,
  NORMAL: 1.0,
  HIGH: 1.8,
  EXTREME: 3.0,
};

/** Market regime drift bias (daily-scale, scaled per tick) */
export const MARKET_REGIME_DRIFT: Record<MarketRegime, number> = {
  BULL: 0.00015,
  BEAR: -0.00015,
  NEUTRAL: 0,
  HIGH_VOLATILITY: 0,
};

/** NSE-style session: 09:15 – 15:30 IST expressed as ms from midnight UTC+5:30 offset handled in clock */
export const SESSION_OPEN_HOUR = 9;
export const SESSION_OPEN_MINUTE = 15;
export const SESSION_CLOSE_HOUR = 15;
export const SESSION_CLOSE_MINUTE = 30;

/** Speed multipliers available in dev controls */
export const ALLOWED_SPEED_MULTIPLIERS = [0.25, 0.5, 1, 2, 5, 10] as const;

export const MIN_PRICE = 0.01;
