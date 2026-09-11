import { describe, expect, it } from "vitest";

import { parseHistoricalCsv } from "@/lib/market/ingestion/parser";
import { validateHistoricalRow } from "@/lib/market/ingestion/validators";
import { validateOhlcv } from "@/lib/market/simulation/ohlcv";
import {
  computeSectorPerformance,
  createEngineState,
  MarketSimulationEngine,
} from "@/lib/market/simulation/engine";
import { createSeededRandom } from "@/lib/market/simulation/random";
import {
  applyLogReturn,
  computeStockLogReturn,
  createInitialStockState,
} from "@/lib/market/simulation/stock-process";
import { INDIAN_STOCK_UNIVERSE } from "@/lib/market/universe/stocks";

describe("seeded PRNG", () => {
  it("reproduces the same sequence for the same seed", () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);

    for (let index = 0; index < 10; index += 1) {
      expect(a.next()).toBe(b.next());
    }
  });
});

describe("OHLCV validation", () => {
  it("accepts valid candles", () => {
    expect(() =>
      validateOhlcv({ open: 100, high: 105, low: 98, close: 103, volume: 1000 }),
    ).not.toThrow();
  });

  it("rejects invalid high/low relationships", () => {
    expect(() =>
      validateOhlcv({ open: 100, high: 95, low: 98, close: 103, volume: 1000 }),
    ).toThrow();
  });
});

describe("market simulation engine", () => {
  const stockInputs = INDIAN_STOCK_UNIVERSE.slice(0, 8).map((stock) => ({
    symbol: stock.symbol,
    sector: stock.sector,
    price: stock.referencePrice,
    previousClose: stock.referencePrice * 0.99,
    beta: stock.beta,
    sectorBeta: stock.sectorBeta,
    baseVolatility: stock.baseVolatility,
  }));

  it("produces deterministic paths for a fixed seed", () => {
    const engineA = new MarketSimulationEngine(createEngineState(stockInputs, 99));
    const engineB = new MarketSimulationEngine(createEngineState(stockInputs, 99));

    const resultA = engineA.advanceTick();
    const resultB = engineB.advanceTick();

    expect(resultA.stocks.RELIANCE.price).toBe(resultB.stocks.RELIANCE.price);
  });

  it("keeps all prices positive after many ticks", () => {
    const engine = new MarketSimulationEngine(createEngineState(stockInputs, 7));

    for (let tick = 0; tick < 200; tick += 1) {
      const result = engine.advanceTick();

      for (const stock of Object.values(result.stocks)) {
        expect(stock.price).toBeGreaterThan(0);
      }
    }
  });

  it("applies market-wide factor to multiple stocks", () => {
    const engine = new MarketSimulationEngine(createEngineState(stockInputs, 123));
    let foundCorrelatedTick = false;

    for (let tick = 0; tick < 50; tick += 1) {
      const result = engine.advanceTick();

      if (Math.abs(result.marketReturn) < 0.0001) {
        continue;
      }

      const sameSignCount = Object.values(result.stocks).filter(
        (stock) => Math.sign(stock.lastReturn) === Math.sign(result.marketReturn),
      ).length;

      if (sameSignCount >= 4) {
        foundCorrelatedTick = true;
        break;
      }
    }

    expect(foundCorrelatedTick).toBe(true);
  });

  it("does not produce identical returns for every stock", () => {
    const engine = new MarketSimulationEngine(createEngineState(stockInputs, 55));
    const result = engine.advanceTick();
    const returns = Object.values(result.stocks).map((stock) => stock.lastReturn);
    const unique = new Set(returns.map((value) => value.toFixed(6)));

    expect(unique.size).toBeGreaterThan(1);
  });
});

describe("stock process helpers", () => {
  it("applies log returns without zero prices", () => {
    expect(applyLogReturn(100, -5)).toBeGreaterThan(0);
    expect(applyLogReturn(100, 0.02)).toBeGreaterThan(100);
  });

  it("computes bounded stock log returns", () => {
    const stock = createInitialStockState({
      symbol: "TCS",
      sector: "IT",
      price: 1000,
      previousClose: 990,
      beta: 0.9,
      sectorBeta: 1.1,
      baseVolatility: 0.01,
    });

    const rng = createSeededRandom(1);
    const logReturn = computeStockLogReturn(
      stock,
      0.001,
      0.0008,
      "NORMAL",
      0,
      rng,
    );

    expect(Math.abs(logReturn)).toBeLessThan(0.02);
  });
});

describe("historical CSV import validation", () => {
  it("parses fixture CSV rows", () => {
    const csv = `date,symbol,exchange,open,high,low,close,volume
2026-08-01,RELIANCE,NSE,1400,1418,1395,1410,1000`;

    const rows = parseHistoricalCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].symbol).toBe("RELIANCE");
  });

  it("rejects malformed OHLC rows", () => {
    const errors = validateHistoricalRow(
      {
        date: "2026-08-01",
        symbol: "TCS",
        exchange: "NSE",
        open: 100,
        high: 90,
        low: 95,
        close: 98,
        volume: 100,
      },
      2,
    );

    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("sector performance aggregation", () => {
  it("averages sector returns", () => {
    const result = computeSectorPerformance([
      { sector: "IT", changePercent: 2 },
      { sector: "IT", changePercent: 1 },
      { sector: "BANKING", changePercent: -1 },
    ]);

    const it = result.find((item) => item.sector === "IT");
    expect(it?.changePercent).toBe(1.5);
  });
});
