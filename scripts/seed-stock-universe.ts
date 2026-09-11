import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";
import { seedPriceHistoryForStock } from "../lib/market/seed";
import {
  DEMO_STOCKS_LEGACY,
  INDIAN_STOCK_UNIVERSE,
} from "../lib/market/universe/stocks";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function upsertStock(
  stock: {
    symbol: string;
    companyName: string;
    exchange: "NSE" | "BSE";
    isin: string;
    sector: string;
    instrumentType: "EQUITY";
    referencePrice: number;
    description: string;
  },
  options: { isActive: boolean; simulationEnabled: boolean },
) {
  const price = stock.referencePrice.toFixed(2);
  const previousClose = (stock.referencePrice * 0.995).toFixed(2);

  const saved = await prisma.stock.upsert({
    where: {
      exchange_symbol: {
        exchange: stock.exchange,
        symbol: stock.symbol,
      },
    },
    update: {
      companyName: stock.companyName,
      isin: stock.isin,
      sector: stock.sector,
      instrumentType: stock.instrumentType,
      description: stock.description,
      isActive: options.isActive,
      simulationEnabled: options.simulationEnabled,
      priceSource: "HISTORICAL_IMPORT",
    },
    create: {
      symbol: stock.symbol,
      companyName: stock.companyName,
      exchange: stock.exchange,
      isin: stock.isin,
      sector: stock.sector,
      instrumentType: stock.instrumentType,
      description: stock.description,
      currentPrice: price,
      previousClose: previousClose,
      dayOpen: price,
      dayHigh: price,
      dayLow: price,
      volume: BigInt(0),
      priceSource: "HISTORICAL_IMPORT",
      marketStatus: "CLOSED",
      simulationEnabled: options.simulationEnabled,
      isActive: options.isActive,
    },
  });

  const historyCount = await prisma.priceHistory.count({
    where: { stockId: saved.id },
  });

  if (historyCount === 0) {
    await seedPriceHistoryForStock(
      saved.id,
      saved.symbol,
      Number(price),
      30,
      "HISTORICAL",
    );
  }

  return saved;
}

async function main() {
  for (const stock of INDIAN_STOCK_UNIVERSE) {
    await upsertStock(stock, { isActive: true, simulationEnabled: true });
  }

  for (const stock of DEMO_STOCKS_LEGACY) {
    await upsertStock(stock, { isActive: false, simulationEnabled: false });
  }

  await prisma.marketSimulationState.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  console.log(
    `Seeded ${INDIAN_STOCK_UNIVERSE.length} real NSE equities and marked ${DEMO_STOCKS_LEGACY.length} legacy DEMO stocks inactive.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Stock universe seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
