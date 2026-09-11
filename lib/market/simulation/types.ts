export type MarketRegime = "BULL" | "BEAR" | "NEUTRAL" | "HIGH_VOLATILITY";

export type VolatilityRegime = "LOW" | "NORMAL" | "HIGH" | "EXTREME";

export type SimulationSentiment = "BULLISH" | "NEUTRAL" | "BEARISH";

export type MarketSessionPhase = "PRE_OPEN" | "OPEN" | "CLOSE_AUCTION" | "CLOSED";

export type OhlcvCandle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type StockSimulationParams = {
  symbol: string;
  sector: string;
  beta: number;
  sectorBeta: number;
  alpha: number;
  baseVolatility: number;
};

export type StockSimulationState = {
  symbol: string;
  sector: string;
  beta: number;
  sectorBeta: number;
  alpha: number;
  baseVolatility: number;
  price: number;
  previousClose: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  referencePrice: number;
  rollingReturns: number[];
  rollingVolatility: number;
  lastReturn: number;
};

export type SimulationTickResult = {
  stocks: Record<string, StockSimulationState>;
  marketRegime: MarketRegime;
  volatilityRegime: VolatilityRegime;
  sentiment: SimulationSentiment;
  marketReturn: number;
  sectorReturns: Record<string, number>;
  simulationTimeMs: number;
  sessionPhase: MarketSessionPhase;
  tick: number;
};

export type SimulationEngineState = {
  seed: number;
  tick: number;
  simulationTimeMs: number;
  marketRegime: MarketRegime;
  volatilityRegime: VolatilityRegime;
  sentiment: SimulationSentiment;
  marketReturn: number;
  sectorReturns: Record<string, number>;
  stocks: Record<string, StockSimulationState>;
  recentMarketReturns: number[];
  clusteredVolatility: number;
  isRunning: boolean;
  speedMultiplier: number;
  sessionOpenMs: number;
  sessionCloseMs: number;
};

export type StockPriceInput = {
  symbol: string;
  sector: string;
  price: number;
  previousClose: number;
  beta: number;
  sectorBeta: number;
  baseVolatility: number;
  volume?: number;
};
