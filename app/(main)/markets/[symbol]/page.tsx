import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StockDetailClient } from "@/components/markets/stock-detail-client";
import { requireAuth } from "@/lib/auth/session";
import {
  getPriceHistory,
  getStockBySymbol,
  isStockInWatchlist,
} from "@/lib/market/service";
import { isValidSymbol } from "@/lib/market/search";

type StockDetailPageProps = {
  params: Promise<{ symbol: string }>;
};

export async function generateMetadata({
  params,
}: StockDetailPageProps): Promise<Metadata> {
  const { symbol } = await params;

  return {
    title: isValidSymbol(symbol) ? `${symbol.toUpperCase()} — Markets` : "Markets",
  };
}

export default async function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = await params;

  if (!isValidSymbol(symbol)) {
    notFound();
  }

  const user = await requireAuth();
  const stock = await getStockBySymbol(symbol);

  if (!stock) {
    notFound();
  }

  const [history, inWatchlist] = await Promise.all([
    getPriceHistory(symbol, 90, { source: "all" }),
    isStockInWatchlist(user.id, symbol),
  ]);

  return (
    <StockDetailClient
      stock={stock}
      history={history}
      inWatchlist={inWatchlist}
    />
  );
}
