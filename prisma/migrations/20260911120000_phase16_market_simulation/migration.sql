-- Phase 16: Real stock universe + natural market simulation

CREATE TYPE "MarketSessionStatus" AS ENUM ('PRE_OPEN', 'OPEN', 'CLOSED');
CREATE TYPE "PriceHistorySource" AS ENUM ('HISTORICAL', 'SIMULATED');

-- Stock extensions
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "isin" TEXT;
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "sector" TEXT;
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "instrumentType" TEXT NOT NULL DEFAULT 'EQUITY';
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "dayOpen" DECIMAL(18,2);
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "dayHigh" DECIMAL(18,2);
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "dayLow" DECIMAL(18,2);
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "volume" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "priceSource" TEXT NOT NULL DEFAULT 'SIMULATION';
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "marketStatus" "MarketSessionStatus" NOT NULL DEFAULT 'CLOSED';
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "lastMarketUpdateAt" TIMESTAMP(3);
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "simulationEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "onChainStockId" INTEGER;

-- Replace symbol-only unique with exchange+symbol
ALTER TABLE "Stock" DROP CONSTRAINT IF EXISTS "Stock_symbol_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Stock_exchange_symbol_key" ON "Stock"("exchange", "symbol");

CREATE INDEX IF NOT EXISTS "Stock_symbol_idx" ON "Stock"("symbol");
CREATE INDEX IF NOT EXISTS "Stock_isin_idx" ON "Stock"("isin");
CREATE INDEX IF NOT EXISTS "Stock_sector_idx" ON "Stock"("sector");
CREATE INDEX IF NOT EXISTS "Stock_simulationEnabled_idx" ON "Stock"("simulationEnabled");

-- PriceHistory extensions
ALTER TABLE "PriceHistory" ADD COLUMN IF NOT EXISTS "open" DECIMAL(18,2);
ALTER TABLE "PriceHistory" ADD COLUMN IF NOT EXISTS "high" DECIMAL(18,2);
ALTER TABLE "PriceHistory" ADD COLUMN IF NOT EXISTS "low" DECIMAL(18,2);
ALTER TABLE "PriceHistory" ADD COLUMN IF NOT EXISTS "close" DECIMAL(18,2);
ALTER TABLE "PriceHistory" ADD COLUMN IF NOT EXISTS "volume" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "PriceHistory" ADD COLUMN IF NOT EXISTS "sourceType" "PriceHistorySource" NOT NULL DEFAULT 'SIMULATED';

UPDATE "PriceHistory" SET "close" = "price" WHERE "close" IS NULL;
UPDATE "PriceHistory" SET "open" = "price", "high" = "price", "low" = "price" WHERE "open" IS NULL;

CREATE INDEX IF NOT EXISTS "PriceHistory_sourceType_idx" ON "PriceHistory"("sourceType");
CREATE UNIQUE INDEX IF NOT EXISTS "PriceHistory_stockId_timestamp_sourceType_key"
  ON "PriceHistory"("stockId", "timestamp", "sourceType");

-- Simulation state singleton
CREATE TABLE IF NOT EXISTS "MarketSimulationState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "seed" INTEGER NOT NULL DEFAULT 42,
    "simulationTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marketRegime" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "volatilityRegime" TEXT NOT NULL DEFAULT 'NORMAL',
    "sentiment" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "speedMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "lastTickAt" TIMESTAMP(3),
    "stateJson" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketSimulationState_pkey" PRIMARY KEY ("id")
);
