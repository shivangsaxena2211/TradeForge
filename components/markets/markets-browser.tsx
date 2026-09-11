"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SearchInput } from "@/components/shared/search-input";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import type { MarketStock, MarketSummary } from "@/lib/market/types";

import { MarketStockTable } from "./market-stock-table";

type MarketsBrowserProps = {
  initialStocks: MarketStock[];
  initialSummary: MarketSummary;
  initialWatchlistSymbols: string[];
};

type SortKey = "symbol" | "price" | "changePercent";

export function MarketsBrowser({
  initialStocks,
  initialSummary,
  initialWatchlistSymbols,
}: MarketsBrowserProps) {
  const [stocks, setStocks] = useState(initialStocks);
  const [summary, setSummary] = useState(initialSummary);
  const [watchlistSymbols, setWatchlistSymbols] = useState(
    initialWatchlistSymbols,
  );
  const [search, setSearch] = useState("");
  const [exchange, setExchange] = useState<string>("ALL");
  const [activeOnly, setActiveOnly] = useState(false);
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (exchange !== "ALL") {
        params.set("exchange", exchange);
      }

      if (activeOnly) {
        params.set("activeOnly", "true");
      }

      if (watchlistOnly) {
        params.set("watchlistOnly", "true");
      }

      const [stocksResponse, summaryResponse, watchlistResponse] =
        await Promise.all([
          fetch(`/api/market/stocks?${params.toString()}`),
          fetch("/api/market/summary"),
          fetch("/api/market/watchlist"),
        ]);

      if (!stocksResponse.ok) {
        throw new Error("Unable to load market stocks.");
      }

      const stocksData = await stocksResponse.json();
      setStocks(stocksData.stocks ?? []);

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      }

      if (watchlistResponse.ok) {
        const watchlistData = await watchlistResponse.json();
        setWatchlistSymbols(
          (watchlistData.watchlist ?? []).map(
            (item: { symbol: string }) => item.symbol,
          ),
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load market data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, exchange, activeOnly, watchlistOnly]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadStocks();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadStocks]);

  const sortedStocks = useMemo(() => {
    const next = [...stocks];

    next.sort((left, right) => {
      if (sortKey === "price") {
        return right.currentPrice - left.currentPrice;
      }

      if (sortKey === "changePercent") {
        return right.changePercent - left.changePercent;
      }

      return left.symbol.localeCompare(right.symbol);
    });

    return next;
  }, [stocks, sortKey]);

  const exchanges = useMemo(() => {
    const values = new Set(initialStocks.map((stock) => stock.exchange));
    return ["ALL", ...Array.from(values).sort()];
  }, [initialStocks]);

  return (
    <>
      <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        {summary.note}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Simulation Sentiment"
          value={summary.sentiment ?? "NEUTRAL"}
          description={`Regime: ${summary.marketRegime ?? "NEUTRAL"} · Vol: ${summary.volatilityRegime ?? "NORMAL"}`}
          highlight
        />
        <StatCard
          title="Active Stocks"
          value={String(summary.activeStocks)}
          description={`${summary.totalStocks} real listed securities (simulated prices)`}
        />
        <StatCard
          title="Top Gainer"
          value={
            summary.topGainers[0]
              ? `${summary.topGainers[0].symbol} (${summary.topGainers[0].changePercent.toFixed(2)}%)`
              : "—"
          }
          description="Session simulated mover"
        />
        <StatCard
          title="Simulation Status"
          value={summary.simulationStatus ?? "PAUSED"}
          description={
            summary.simulationTime
              ? `Clock: ${new Date(summary.simulationTime).toLocaleString("en-IN")}`
              : "Engine idle"
          }
        />
      </div>

      {summary.sectorPerformance?.length > 0 ? (
        <SectionCard title="Sector Performance" description="Aggregated simulated session returns by sector.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summary.sectorPerformance.slice(0, 9).map((sector) => (
              <div
                key={sector.sector}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-sm"
              >
                <span className="font-medium">{sector.sector}</span>
                <span
                  className={
                    sector.changePercent >= 0 ? "text-success" : "text-destructive"
                  }
                >
                  {sector.changePercent >= 0 ? "+" : ""}
                  {sector.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SearchInput
          label="Search stocks"
          placeholder="Search by symbol or company..."
          className="max-w-md"
          value={search}
          onChange={setSearch}
          helperText="Simulated market data only — not live NSE/BSE prices."
        />

        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border bg-background px-3 py-2 text-sm"
            value={exchange}
            onChange={(event) => setExchange(event.target.value)}
            aria-label="Filter by exchange"
          >
            {exchanges.map((value) => (
              <option key={value} value={value}>
                {value === "ALL" ? "All exchanges" : value}
              </option>
            ))}
          </select>

          <select
            className="rounded-lg border bg-background px-3 py-2 text-sm"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            aria-label="Sort stocks"
          >
            <option value="symbol">Sort: Symbol</option>
            <option value="price">Sort: Price</option>
            <option value="changePercent">Sort: Change %</option>
          </select>

          <Button
            type="button"
            variant={activeOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveOnly((value) => !value)}
          >
            Active only
          </Button>

          <Button
            type="button"
            variant={watchlistOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setWatchlistOnly((value) => !value)}
          >
            Watchlist
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : null}

      <SectionCard
        title="Indian Equity Universe"
        description="Real listed security identities with DEFINN-simulated prices. Execution occurs on Stock.sol — not on NSE/BSE."
      >
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading simulated market data...
          </p>
        ) : (
          <MarketStockTable
            stocks={sortedStocks}
            showActions
            watchlistSymbols={watchlistSymbols}
          />
        )}
      </SectionCard>
    </>
  );
}
