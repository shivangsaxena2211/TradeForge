export type SimulationStatus = "LIVE" | "PAUSED" | "UNAVAILABLE";

export type MarketStock = {
  id: string;
  symbol: string;
  companyName: string;
  exchange: string;
  isin: string | null;
  sector: string | null;
  instrumentType: string;
  description: string | null;
  currentPrice: number;
  previousClose: number;
  dayOpen: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number;
  change: number;
  changePercent: number;
  simulatedVolume: number;
  priceSource: string;
  marketStatus: string;
  simulationStatus: SimulationStatus;
  simulationEnabled: boolean;
  isActive: boolean;
  onChainStockId: number | null;
  lastMarketUpdateAt: string | null;
};

export type MarketStockDetail = MarketStock & {
  priceHistoryCount: number;
};

export type PriceHistoryPoint = {
  timestamp: string;
  price: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number;
  sourceType: "HISTORICAL" | "SIMULATED";
};

export type SectorPerformance = {
  sector: string;
  changePercent: number;
};

export type MarketSummary = {
  label: string;
  activeStocks: number;
  totalStocks: number;
  topGainers: MarketStock[];
  topLosers: MarketStock[];
  mostActive: MarketStock[];
  sectorPerformance: SectorPerformance[];
  totalSimulatedVolume: number;
  marketRegime: string;
  volatilityRegime: string;
  sentiment: string;
  simulationStatus: SimulationStatus;
  simulationTime: string | null;
  note: string;
};

export type WatchlistItem = {
  symbol: string;
  companyName: string;
  exchange: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  isActive: boolean;
  addedAt: string;
};

export type MarketStatusResponse = {
  marketStatus: string;
  simulationTime: string | null;
  simulationSpeed: number;
  marketRegime: string;
  volatilityRegime: string;
  sentiment: string;
  lastUpdate: string | null;
  activeStocks: number;
  isRunning: boolean;
  seed: number;
  disclaimer: string;
};
