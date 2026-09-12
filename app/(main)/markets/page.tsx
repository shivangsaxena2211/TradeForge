import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { MarketsBrowser } from "@/components/markets/markets-browser";
import { EmptyState } from "@/components/shared/empty-state";
import { requireAuth } from "@/lib/auth/session";
import {
  getMarketSummary,
  getUserWatchlist,
  listStocks,
} from "@/lib/market/service";
import type { MarketStock, MarketSummary } from "@/lib/market/types";

export const metadata: Metadata = {
  title: "Markets",
};

async function loadMarketsPageData(userId: string): Promise<{
  stocks: MarketStock[];
  summary: MarketSummary;
  watchlistSymbols: string[];
}> {
  const [stocks, summary, watchlist] = await Promise.all([
    listStocks(),
    getMarketSummary(),
    getUserWatchlist(userId),
  ]);

  return {
    stocks,
    summary,
    watchlistSymbols: watchlist.map((item) => item.symbol),
  };
}

export default async function MarketsPage() {
  const user = await requireAuth();
  const data = await loadMarketsPageData(user.id).catch((error) => {
    console.error("Markets page failed:", error);
    return null;
  });

  if (!data) {
    return (
      <>
        <PageHeader
          title="Markets"
          description="Browse simulated NSE equities on DEFINN."
          badge="Simulated Market Data"
        />
        <EmptyState
          title="Market data unavailable"
          description="PostgreSQL is required to load simulated market data. Ensure DATABASE_URL is configured and migrations are applied."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Markets"
        description="Browse simulated NSE equities on DEFINN."
        badge="Simulated Market Data"
      />
      <MarketsBrowser
        initialStocks={data.stocks}
        initialSummary={data.summary}
        initialWatchlistSymbols={data.watchlistSymbols}
      />
    </>
  );
}
