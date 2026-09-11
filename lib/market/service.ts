import "server-only";

import type { PriceHistorySource, Prisma } from "@/lib/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/client";

import { calculateChange, decimalToNumber } from "./calculations";
import { mapStockToMarketDetail, mapStockToMarketStock } from "./mappers";
import { findStockBySymbolOrFirst } from "./repository";
import { computeSectorPerformance } from "./simulation/engine";
import { getSimulationEngineService } from "./simulation/engine-service";
import { isValidSymbol, normalizeSearchQuery } from "./search";
import type {
  MarketStock,
  MarketStockDetail,
  MarketStatusResponse,
  MarketSummary,
  PriceHistoryPoint,
  SimulationStatus,
  WatchlistItem,
} from "./types";

type ListStocksOptions = {
  search?: string;
  exchange?: string;
  activeOnly?: boolean;
  watchlistUserId?: string;
};

type HistoryOptions = {
  limit?: number;
  source?: "historical" | "simulated" | "all";
};

function buildStockWhere(options: ListStocksOptions): Prisma.StockWhereInput {
  const where: Prisma.StockWhereInput = {};
  const search = normalizeSearchQuery(options.search);

  if (options.activeOnly) {
    where.isActive = true;
  }

  if (options.exchange) {
    where.exchange = options.exchange.trim().toUpperCase();
  }

  if (search) {
    where.OR = [
      { symbol: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { sector: { contains: search, mode: "insensitive" } },
    ];
  }

  if (options.watchlistUserId) {
    where.watchlists = {
      some: {
        userId: options.watchlistUserId,
      },
    };
  }

  return where;
}

async function getEngineRunning(): Promise<boolean | null> {
  try {
    const service = getSimulationEngineService();
    const status = await service.getStatus();
    return status.isRunning;
  } catch {
    return null;
  }
}

export async function listStocks(
  options: ListStocksOptions = {},
): Promise<MarketStock[]> {
  const prisma = getPrismaClient();
  const engineRunning = await getEngineRunning();
  const stocks = await prisma.stock.findMany({
    where: buildStockWhere(options),
    orderBy: { symbol: "asc" },
  });

  return stocks.map((stock) => mapStockToMarketStock(stock, engineRunning));
}

export async function getStockBySymbol(
  symbol: string,
): Promise<MarketStockDetail | null> {
  if (!isValidSymbol(symbol)) {
    return null;
  }

  const prisma = getPrismaClient();
  const engineRunning = await getEngineRunning();
  const stock = await findStockBySymbolOrFirst(symbol);

  if (!stock) {
    return null;
  }

  const priceHistoryCount = await prisma.priceHistory.count({
    where: { stockId: stock.id },
  });

  return mapStockToMarketDetail(stock, priceHistoryCount, engineRunning);
}

export async function getPriceHistory(
  symbol: string,
  limit = 30,
  options: HistoryOptions = {},
): Promise<PriceHistoryPoint[]> {
  if (!isValidSymbol(symbol)) {
    return [];
  }

  const prisma = getPrismaClient();
  const stock = await findStockBySymbolOrFirst(symbol);

  if (!stock) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 365);
  const sourceFilter =
    options.source === "historical"
      ? ("HISTORICAL" as PriceHistorySource)
      : options.source === "simulated"
        ? ("SIMULATED" as PriceHistorySource)
        : undefined;

  const history = await prisma.priceHistory.findMany({
    where: {
      stockId: stock.id,
      ...(sourceFilter ? { sourceType: sourceFilter } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: safeLimit,
  });

  return history
    .slice()
    .reverse()
    .map((point) => ({
      timestamp: point.timestamp.toISOString(),
      price: decimalToNumber(point.close ?? point.price),
      open: point.open ? decimalToNumber(point.open) : null,
      high: point.high ? decimalToNumber(point.high) : null,
      low: point.low ? decimalToNumber(point.low) : null,
      close: point.close ? decimalToNumber(point.close) : decimalToNumber(point.price),
      volume: Number(point.volume),
      sourceType: point.sourceType,
    }));
}

export async function getMarketSummary(): Promise<MarketSummary> {
  const service = getSimulationEngineService();
  await service.ensureInitialized();

  const stocks = await listStocks({ activeOnly: true });
  const status = await service.getStatus();

  const sortedByChange = [...stocks].sort(
    (left, right) => right.changePercent - left.changePercent,
  );

  const mostActive = [...stocks]
    .sort((left, right) => right.volume - left.volume)
    .slice(0, 5);

  const simulationStatus: SimulationStatus = status.isRunning ? "LIVE" : "PAUSED";

  return {
    label: "DEFINN Simulated Indian Market",
    activeStocks: stocks.length,
    totalStocks: stocks.length,
    topGainers: sortedByChange.filter((stock) => stock.changePercent > 0).slice(0, 5),
    topLosers: [...sortedByChange]
      .filter((stock) => stock.changePercent < 0)
      .sort((left, right) => left.changePercent - right.changePercent)
      .slice(0, 5),
    mostActive,
    sectorPerformance: computeSectorPerformance(
      stocks.map((stock) => ({
        sector: stock.sector ?? "INDUSTRIALS",
        changePercent: stock.changePercent,
      })),
    ),
    totalSimulatedVolume: stocks.reduce((total, stock) => total + stock.volume, 0),
    marketRegime: status.marketRegime,
    volatilityRegime: status.volatilityRegime,
    sentiment: status.sentiment,
    simulationStatus,
    simulationTime: status.simulationTime,
    note:
      "DEFINN uses real listed security identities with locally simulated prices. No orders are sent to NSE/BSE.",
  };
}

export async function getMarketStatus(): Promise<MarketStatusResponse> {
  const service = getSimulationEngineService();
  await service.ensureInitialized();
  const status = await service.getStatus();

  return {
    marketStatus: status.isRunning ? "OPEN" : "CLOSED",
    simulationTime: status.simulationTime,
    simulationSpeed: status.speedMultiplier,
    marketRegime: status.marketRegime,
    volatilityRegime: status.volatilityRegime,
    sentiment: status.sentiment,
    lastUpdate: status.lastUpdate,
    activeStocks: status.activeStocks,
    isRunning: status.isRunning,
    seed: status.seed,
    disclaimer:
      "DEFINN is an academic stock-market simulation. Prices may be based on historical/reference market data, while all future movements and trade execution are simulated. No orders are sent to NSE/BSE.",
  };
}

export async function getCurrentSimulatedPriceInr(symbol: string): Promise<number | null> {
  const stock = await getStockBySymbol(symbol);
  return stock?.currentPrice ?? null;
}

export async function updateSimulatedPrice(
  symbol: string,
): Promise<MarketStock | null> {
  if (!isValidSymbol(symbol)) {
    return null;
  }

  const prisma = getPrismaClient();
  const stock = await findStockBySymbolOrFirst(symbol);

  if (!stock || !stock.isActive || !stock.simulationEnabled) {
    return null;
  }

  const service = getSimulationEngineService();
  await service.ensureInitialized();
  const engine = await service.ensureInitialized();
  engine.advanceTick();
  await service.persistState();

  const refreshed = await prisma.stock.findUnique({ where: { id: stock.id } });

  if (!refreshed) {
    return null;
  }

  return mapStockToMarketStock(refreshed);
}

export async function getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  const prisma = getPrismaClient();
  const items = await prisma.watchlist.findMany({
    where: { userId },
    include: { stock: true },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => {
    const currentPrice = decimalToNumber(item.stock.currentPrice);
    const previousClose = decimalToNumber(item.stock.previousClose);
    const { change, changePercent } = calculateChange(currentPrice, previousClose);

    return {
      symbol: item.stock.symbol,
      companyName: item.stock.companyName,
      exchange: item.stock.exchange,
      currentPrice,
      change,
      changePercent,
      isActive: item.stock.isActive,
      addedAt: item.createdAt.toISOString(),
    };
  });
}

export async function isStockInWatchlist(
  userId: string,
  symbol: string,
): Promise<boolean> {
  if (!isValidSymbol(symbol)) {
    return false;
  }

  const prisma = getPrismaClient();
  const stock = await findStockBySymbolOrFirst(symbol);

  if (!stock) {
    return false;
  }

  const entry = await prisma.watchlist.findUnique({
    where: {
      userId_stockId: {
        userId,
        stockId: stock.id,
      },
    },
  });

  return Boolean(entry);
}

export async function addToWatchlist(
  userId: string,
  symbol: string,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!isValidSymbol(symbol)) {
    return { success: false, error: "Invalid stock symbol." };
  }

  const prisma = getPrismaClient();
  const stock = await findStockBySymbolOrFirst(symbol);

  if (!stock) {
    return { success: false, error: "Stock not found." };
  }

  const existing = await prisma.watchlist.findUnique({
    where: {
      userId_stockId: {
        userId,
        stockId: stock.id,
      },
    },
  });

  if (existing) {
    return { success: false, error: "Stock is already in your watchlist." };
  }

  await prisma.watchlist.create({
    data: {
      userId,
      stockId: stock.id,
    },
  });

  return { success: true };
}

export async function removeFromWatchlist(
  userId: string,
  symbol: string,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!isValidSymbol(symbol)) {
    return { success: false, error: "Invalid stock symbol." };
  }

  const prisma = getPrismaClient();
  const stock = await findStockBySymbolOrFirst(symbol);

  if (!stock) {
    return { success: false, error: "Stock not found." };
  }

  const existing = await prisma.watchlist.findUnique({
    where: {
      userId_stockId: {
        userId,
        stockId: stock.id,
      },
    },
  });

  if (!existing) {
    return { success: false, error: "Stock is not in your watchlist." };
  }

  await prisma.watchlist.delete({
    where: { id: existing.id },
  });

  return { success: true };
}
