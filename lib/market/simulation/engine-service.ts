import "server-only";

import { getPrismaClient } from "@/lib/db/client";
import { decimalToNumber, roundCurrency } from "@/lib/market/calculations";

import { INDIAN_STOCK_UNIVERSE } from "@/lib/market/universe/stocks";

import {
  DB_PERSIST_INTERVAL_MS,
  DEFAULT_SIM_MINUTE_MS,
  DEFAULT_SIMULATION_SEED,
  UI_TICK_INTERVAL_MS,
} from "./config";
import { createEngineState, MarketSimulationEngine } from "./engine";
import type { SimulationEngineState, StockPriceInput, StockSimulationState } from "./types";

type EngineServiceOptions = {
  autoStart?: boolean;
};

export type MarketStatusSnapshot = {
  isRunning: boolean;
  simulationTime: string;
  speedMultiplier: number;
  marketRegime: string;
  volatilityRegime: string;
  sentiment: string;
  sessionPhase: string;
  activeStocks: number;
  lastUpdate: string | null;
  seed: number;
  tick: number;
};

let globalService: SimulationEngineService | null = null;

export function getSimulationEngineService(): SimulationEngineService {
  if (!globalService) {
    globalService = new SimulationEngineService();
  }

  return globalService;
}

export class SimulationEngineService {
  private engine: MarketSimulationEngine | null = null;
  private uiInterval: ReturnType<typeof setInterval> | null = null;
  private persistInterval: ReturnType<typeof setInterval> | null = null;
  private initialized = false;
  private lastPersistAt = 0;

  async initialize(options: EngineServiceOptions = {}): Promise<void> {
    if (this.initialized) {
      return;
    }

    const stocks = await this.loadStocksFromDatabase();
    const persisted = await this.loadPersistedState();

    const initialState = persisted ?? createEngineState(stocks, DEFAULT_SIMULATION_SEED);
    this.engine = new MarketSimulationEngine(initialState);
    this.initialized = true;

    if (options.autoStart ?? process.env.MARKET_SIMULATION_AUTO_START === "true") {
      this.start();
    }
  }

  async ensureInitialized(): Promise<MarketSimulationEngine> {
    if (!this.engine) {
      await this.initialize({ autoStart: false });
    }

    if (!this.engine) {
      throw new Error("Simulation engine failed to initialize.");
    }

    return this.engine;
  }

  start(): void {
    if (!this.engine) {
      return;
    }

    this.engine.setRunning(true);

    if (!this.uiInterval) {
      this.uiInterval = setInterval(() => {
        void this.runTick();
      }, UI_TICK_INTERVAL_MS);
    }

    if (!this.persistInterval) {
      this.persistInterval = setInterval(() => {
        void this.persistState();
      }, DB_PERSIST_INTERVAL_MS);
    }
  }

  pause(): void {
    this.engine?.setRunning(false);
  }

  async reset(seed = DEFAULT_SIMULATION_SEED): Promise<void> {
    const stocks = await this.loadStocksFromDatabase();
    const engine = await this.ensureInitialized();
    engine.reset(seed, stocks);
    await this.persistState();
  }

  setSpeed(multiplier: number): void {
    this.engine?.setSpeedMultiplier(multiplier);
  }

  async getStatus(): Promise<MarketStatusSnapshot> {
    const engine = await this.ensureInitialized();
    const state = engine.getState();
    const activeStocks = Object.keys(state.stocks).length;

    return {
      isRunning: state.isRunning,
      simulationTime: new Date(state.simulationTimeMs).toISOString(),
      speedMultiplier: state.speedMultiplier,
      marketRegime: state.marketRegime,
      volatilityRegime: state.volatilityRegime,
      sentiment: state.sentiment,
      sessionPhase: "OPEN",
      activeStocks,
      lastUpdate: state.tick > 0 ? new Date().toISOString() : null,
      seed: state.seed,
      tick: state.tick,
    };
  }

  getEngineState(): SimulationEngineState | null {
    return this.engine?.getState() ?? null;
  }

  private async runTick(): Promise<void> {
    if (!this.engine || !this.engine.getState().isRunning) {
      return;
    }

    try {
      const state = this.engine.getState();
      const simulatedMinuteMs = DEFAULT_SIM_MINUTE_MS / state.speedMultiplier;
      const result = this.engine.advanceTick(simulatedMinuteMs);
      await this.applyTickToDatabase(result.stocks);

      if (Date.now() - this.lastPersistAt > DB_PERSIST_INTERVAL_MS) {
        await this.persistState();
      }
    } catch (error) {
      console.error("Market simulation tick failed:", error instanceof Error ? error.message : error);
    }
  }

  private async applyTickToDatabase(
    stocks: Record<string, StockSimulationState>,
  ): Promise<void> {
    const prisma = getPrismaClient();

    for (const stockState of Object.values(stocks)) {
      const stock = await prisma.stock.findFirst({
        where: {
          symbol: stockState.symbol,
          simulationEnabled: true,
          isActive: true,
        },
      });

      if (!stock) {
        continue;
      }

      const closePrice = roundCurrency(stockState.price).toFixed(2);

      await prisma.$transaction(async (tx) => {
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            currentPrice: closePrice,
            dayOpen: stock.dayOpen?.toString() ?? closePrice,
            dayHigh: roundCurrency(stockState.dayHigh).toFixed(2),
            dayLow: roundCurrency(stockState.dayLow).toFixed(2),
            volume: BigInt(stockState.volume),
            priceSource: "SIMULATION",
            marketStatus: "OPEN",
            lastMarketUpdateAt: new Date(),
          },
        });

        await tx.priceHistory.create({
          data: {
            stockId: stock.id,
            price: closePrice,
            open: roundCurrency(stockState.dayOpen).toFixed(2),
            high: roundCurrency(stockState.dayHigh).toFixed(2),
            low: roundCurrency(stockState.dayLow).toFixed(2),
            close: closePrice,
            volume: BigInt(Math.max(0, stockState.volume)),
            sourceType: "SIMULATED",
          },
        });
      });
    }
  }

  private async loadStocksFromDatabase(): Promise<StockPriceInput[]> {
    const prisma = getPrismaClient();
    const stocks = await prisma.stock.findMany({
      where: { isActive: true, simulationEnabled: true },
      orderBy: { symbol: "asc" },
    });

    const universeBySymbol = new Map(
      INDIAN_STOCK_UNIVERSE.map((item) => [item.symbol, item]),
    );

    return stocks.map((stock) => {
      const meta = universeBySymbol.get(stock.symbol);

      return {
        symbol: stock.symbol,
        sector: stock.sector ?? meta?.sector ?? "INDUSTRIALS",
        price: decimalToNumber(stock.currentPrice),
        previousClose: decimalToNumber(stock.previousClose),
        beta: meta?.beta ?? 1,
        sectorBeta: meta?.sectorBeta ?? 1,
        baseVolatility: meta?.baseVolatility ?? 0.012,
        volume: Number(stock.volume),
      };
    });
  }

  private async loadPersistedState(): Promise<SimulationEngineState | null> {
    const prisma = getPrismaClient();

    try {
      const row = await prisma.marketSimulationState.findUnique({
        where: { id: "singleton" },
      });

      if (!row?.stateJson) {
        return null;
      }

      return row.stateJson as SimulationEngineState;
    } catch {
      return null;
    }
  }

  async persistState(): Promise<void> {
    if (!this.engine) {
      return;
    }

    const state = this.engine.getState();
    const prisma = getPrismaClient();

    await prisma.marketSimulationState.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        seed: state.seed,
        simulationTime: new Date(state.simulationTimeMs),
        marketRegime: state.marketRegime,
        volatilityRegime: state.volatilityRegime,
        sentiment: state.sentiment,
        isRunning: state.isRunning,
        speedMultiplier: state.speedMultiplier,
        lastTickAt: new Date(),
        stateJson: state,
      },
      update: {
        seed: state.seed,
        simulationTime: new Date(state.simulationTimeMs),
        marketRegime: state.marketRegime,
        volatilityRegime: state.volatilityRegime,
        sentiment: state.sentiment,
        isRunning: state.isRunning,
        speedMultiplier: state.speedMultiplier,
        lastTickAt: new Date(),
        stateJson: state,
      },
    });

    this.lastPersistAt = Date.now();
  }
}
