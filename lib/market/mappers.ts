import type { Stock } from "@/lib/generated/prisma/client";

import {
  calculateChange,
  decimalToNumber,
  getSimulatedVolume,
} from "./calculations";
import type { MarketStock, MarketStockDetail, SimulationStatus } from "./types";

function mapSimulationStatus(
  isActive: boolean,
  simulationEnabled: boolean,
  engineRunning: boolean | null = null,
): SimulationStatus {
  if (!isActive || !simulationEnabled) {
    return "UNAVAILABLE";
  }

  if (engineRunning === false) {
    return "PAUSED";
  }

  return "LIVE";
}

export function mapStockToMarketStock(
  stock: Stock,
  engineRunning: boolean | null = null,
): MarketStock {
  const currentPrice = decimalToNumber(stock.currentPrice);
  const previousClose = decimalToNumber(stock.previousClose);
  const { change, changePercent } = calculateChange(currentPrice, previousClose);

  return {
    id: stock.id,
    symbol: stock.symbol,
    companyName: stock.companyName,
    exchange: stock.exchange,
    isin: stock.isin,
    sector: stock.sector,
    instrumentType: stock.instrumentType,
    description: stock.description,
    currentPrice,
    previousClose,
    dayOpen: stock.dayOpen ? decimalToNumber(stock.dayOpen) : null,
    dayHigh: stock.dayHigh ? decimalToNumber(stock.dayHigh) : null,
    dayLow: stock.dayLow ? decimalToNumber(stock.dayLow) : null,
    volume: Number(stock.volume),
    change,
    changePercent,
    simulatedVolume: stock.volume > 0 ? Number(stock.volume) : getSimulatedVolume(stock.symbol, currentPrice),
    priceSource: stock.priceSource,
    marketStatus: stock.marketStatus,
    simulationStatus: mapSimulationStatus(
      stock.isActive,
      stock.simulationEnabled,
      engineRunning,
    ),
    simulationEnabled: stock.simulationEnabled,
    isActive: stock.isActive,
    onChainStockId: stock.onChainStockId,
    lastMarketUpdateAt: stock.lastMarketUpdateAt?.toISOString() ?? null,
  };
}

export function mapStockToMarketDetail(
  stock: Stock,
  priceHistoryCount: number,
  engineRunning: boolean | null = null,
): MarketStockDetail {
  return {
    ...mapStockToMarketStock(stock, engineRunning),
    priceHistoryCount,
  };
}
