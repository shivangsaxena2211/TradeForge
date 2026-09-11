import {
  DEFAULT_SIMULATION_SEED,
  DEFAULT_SIM_MINUTE_MS,
  SESSION_CLOSE_HOUR,
  SESSION_CLOSE_MINUTE,
  SESSION_OPEN_HOUR,
  SESSION_OPEN_MINUTE,
  VOLATILITY_MULTIPLIER,
} from "./config";
import { generateMarketReturn } from "./market-factor";
import { generateIntradayCandle, validateOhlcv } from "./ohlcv";
import { createSeededRandom, type SeededRandom } from "./random";
import {
  maybeTransitionMarketRegime,
  maybeTransitionVolatilityRegime,
  updateClusteredVolatility,
} from "./regime";
import { generateSectorReturns, getUniqueSectors } from "./sector-factor";
import {
  computeRollingVolatility,
  computeStockLogReturn,
  createInitialStockState,
  updateRollingReturns,
} from "./stock-process";
import type {
  MarketSessionPhase,
  SimulationEngineState,
  SimulationSentiment,
  SimulationTickResult,
  StockPriceInput,
} from "./types";

function getSessionPhase(simulationTimeMs: number): MarketSessionPhase {
  const date = new Date(simulationTimeMs);
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const openMinutes = SESSION_OPEN_HOUR * 60 + SESSION_OPEN_MINUTE;
  const closeMinutes = SESSION_CLOSE_HOUR * 60 + SESSION_CLOSE_MINUTE;

  if (minutes < openMinutes - 15) {
    return "CLOSED";
  }

  if (minutes < openMinutes) {
    return "PRE_OPEN";
  }

  if (minutes >= closeMinutes) {
    return "CLOSED";
  }

  if (minutes >= closeMinutes - 15) {
    return "CLOSE_AUCTION";
  }

  return "OPEN";
}

function getSessionVolatilityBoost(phase: MarketSessionPhase): number {
  switch (phase) {
    case "PRE_OPEN":
      return 0.35;
    case "OPEN":
      return 0.25;
    case "CLOSE_AUCTION":
      return 0.2;
    default:
      return 0;
  }
}

export function computeSentiment(
  marketReturn: number,
  stocks: Record<string, { lastReturn: number }>,
): SimulationSentiment {
  const stockList = Object.values(stocks);
  const positiveCount = stockList.filter((stock) => stock.lastReturn > 0).length;
  const ratio = stockList.length > 0 ? positiveCount / stockList.length : 0.5;

  if (marketReturn > 0.0005 && ratio >= 0.55) {
    return "BULLISH";
  }

  if (marketReturn < -0.0005 && ratio <= 0.45) {
    return "BEARISH";
  }

  return "NEUTRAL";
}

export function createEngineState(
  stocks: StockPriceInput[],
  seed = DEFAULT_SIMULATION_SEED,
  simulationTimeMs = Date.now(),
): SimulationEngineState {
  const stockStates: SimulationEngineState["stocks"] = {};

  for (const stock of stocks) {
    stockStates[stock.symbol] = createInitialStockState(stock);
  }

  return {
    seed,
    tick: 0,
    simulationTimeMs,
    marketRegime: "NEUTRAL",
    volatilityRegime: "NORMAL",
    sentiment: "NEUTRAL",
    marketReturn: 0,
    sectorReturns: {},
    stocks: stockStates,
    recentMarketReturns: [],
    clusteredVolatility: 0.01,
    isRunning: false,
    speedMultiplier: 1,
    sessionOpenMs: simulationTimeMs,
    sessionCloseMs: simulationTimeMs,
  };
}

export class MarketSimulationEngine {
  private state: SimulationEngineState;
  private rng: SeededRandom;

  constructor(initialState: SimulationEngineState) {
    this.state = initialState;
    this.rng = createSeededRandom(initialState.seed + initialState.tick);
  }

  getState(): SimulationEngineState {
    return { ...this.state, stocks: { ...this.state.stocks } };
  }

  setRunning(running: boolean): void {
    this.state.isRunning = running;
  }

  setSpeedMultiplier(multiplier: number): void {
    this.state.speedMultiplier = multiplier;
  }

  reset(seed: number, stocks: StockPriceInput[]): void {
    this.state = createEngineState(stocks, seed);
    this.rng = createSeededRandom(seed);
  }

  advanceTick(simulatedMinuteMs = DEFAULT_SIM_MINUTE_MS): SimulationTickResult {
    this.state.tick += 1;
    this.state.simulationTimeMs += simulatedMinuteMs;
    this.rng = createSeededRandom(this.state.seed + this.state.tick);

    this.state.marketRegime = maybeTransitionMarketRegime(
      this.state.marketRegime,
      this.rng,
    );

    const sessionPhase = getSessionPhase(this.state.simulationTimeMs);
    const sessionBoost = getSessionVolatilityBoost(sessionPhase);
    const volMultiplier = VOLATILITY_MULTIPLIER[this.state.volatilityRegime];

    this.state.marketReturn = generateMarketReturn(
      this.state.marketRegime,
      volMultiplier,
      this.rng,
    );

    const sectors = getUniqueSectors(Object.values(this.state.stocks));
    this.state.sectorReturns = generateSectorReturns(
      sectors,
      this.state.marketReturn,
      volMultiplier,
      this.rng,
    );

    const updatedStocks: SimulationEngineState["stocks"] = {};

    for (const [symbol, stock] of Object.entries(this.state.stocks)) {
      const sectorReturn = this.state.sectorReturns[stock.sector] ?? 0;
      const logReturn = computeStockLogReturn(
        stock,
        this.state.marketReturn,
        sectorReturn,
        this.state.volatilityRegime,
        sessionBoost,
        this.rng,
      );

      const candle = generateIntradayCandle(
        stock.price,
        logReturn,
        Math.max(10_000, stock.volume || 50_000),
        Math.abs(logReturn),
        sessionBoost,
        this.rng,
      );

      validateOhlcv(candle);

      const rollingReturns = updateRollingReturns(stock.rollingReturns, logReturn);

      updatedStocks[symbol] = {
        ...stock,
        price: candle.close,
        dayHigh: Math.max(stock.dayHigh, candle.high),
        dayLow: Math.min(stock.dayLow, candle.low),
        volume: stock.volume + candle.volume,
        rollingReturns,
        rollingVolatility: computeRollingVolatility(rollingReturns),
        lastReturn: logReturn,
      };
    }

    this.state.stocks = updatedStocks;
    this.state.recentMarketReturns = [
      ...this.state.recentMarketReturns.slice(-19),
      this.state.marketReturn,
    ];

    const latestAbs =
      Math.abs(this.state.marketReturn) +
      Object.values(updatedStocks).reduce(
        (sum, stock) => sum + Math.abs(stock.lastReturn),
        0,
      ) /
        Math.max(1, Object.keys(updatedStocks).length);

    this.state.clusteredVolatility = updateClusteredVolatility(
      this.state.clusteredVolatility,
      latestAbs,
    );

    this.state.volatilityRegime = maybeTransitionVolatilityRegime(
      this.state.volatilityRegime,
      this.rng,
      this.state.clusteredVolatility,
    );

    this.state.sentiment = computeSentiment(
      this.state.marketReturn,
      this.state.stocks,
    );

    return {
      stocks: { ...this.state.stocks },
      marketRegime: this.state.marketRegime,
      volatilityRegime: this.state.volatilityRegime,
      sentiment: this.state.sentiment,
      marketReturn: this.state.marketReturn,
      sectorReturns: { ...this.state.sectorReturns },
      simulationTimeMs: this.state.simulationTimeMs,
      sessionPhase,
      tick: this.state.tick,
    };
  }
}

export function computeSectorPerformance(
  stocks: Array<{ sector: string; changePercent: number }>,
): Array<{ sector: string; changePercent: number }> {
  const buckets = new Map<string, number[]>();

  for (const stock of stocks) {
    const list = buckets.get(stock.sector) ?? [];
    list.push(stock.changePercent);
    buckets.set(stock.sector, list);
  }

  return [...buckets.entries()]
    .map(([sector, changes]) => ({
      sector,
      changePercent:
        Math.round(
          (changes.reduce((sum, value) => sum + value, 0) / changes.length) * 100,
        ) / 100,
    }))
    .sort((left, right) => right.changePercent - left.changePercent);
}
