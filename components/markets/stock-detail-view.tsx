import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { formatChange, formatInr, formatPercent } from "@/lib/format/currency";
import type { MarketStockDetail, PriceHistoryPoint } from "@/lib/market/types";

import { PriceHistoryChart } from "./price-history-chart";
import { WatchlistButton } from "./watchlist-button";

type StockDetailViewProps = {
  stock: MarketStockDetail;
  history: PriceHistoryPoint[];
  inWatchlist: boolean;
};

function changeClass(value: number): string {
  return value >= 0 ? "text-success" : "text-destructive";
}

export function StockDetailView({
  stock,
  history,
  inWatchlist,
}: StockDetailViewProps) {
  const hasHistorical = history.some((point) => point.sourceType === "HISTORICAL");
  const hasSimulated = history.some((point) => point.sourceType === "SIMULATED");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title={stock.symbol}
          description={stock.companyName}
          badge={stock.isActive ? "ACTIVE" : "INACTIVE"}
        />
        <Link href="/markets">
          <Button type="button" variant="outline" size="sm">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Markets
          </Button>
        </Link>
      </div>

      <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        DEFINN is an academic stock-market simulation. Prices may be based on
        historical/reference market data, while all future movements and trade
        execution are simulated. No orders are sent to NSE/BSE.
      </p>

      <div className="definn-card definn-card-glow grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Simulated Price
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight">
            {formatInr(stock.currentPrice)}
          </p>
          <p className={`mt-2 text-sm font-medium ${changeClass(stock.change)}`}>
            {formatChange(stock.change)} ({formatPercent(stock.changePercent)})
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge
              status={stock.simulationStatus === "LIVE" ? "ACTIVE" : "INACTIVE"}
            />
            <span className="text-xs text-muted-foreground">
              Simulation {stock.simulationStatus}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Exchange
          </p>
          <p className="mt-1 text-2xl font-semibold">{stock.exchange}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Real listed security — simulated execution only
          </p>
          {stock.isin ? (
            <p className="mt-1 text-xs text-muted-foreground">ISIN: {stock.isin}</p>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sector
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {stock.sector ?? "—"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Market: {stock.marketStatus}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Source: {stock.priceSource}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="definn-card p-4">
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="mt-1 text-lg font-semibold">
            {stock.dayOpen != null ? formatInr(stock.dayOpen) : "—"}
          </p>
        </div>
        <div className="definn-card p-4">
          <p className="text-xs text-muted-foreground">High</p>
          <p className="mt-1 text-lg font-semibold">
            {stock.dayHigh != null ? formatInr(stock.dayHigh) : "—"}
          </p>
        </div>
        <div className="definn-card p-4">
          <p className="text-xs text-muted-foreground">Low</p>
          <p className="mt-1 text-lg font-semibold">
            {stock.dayLow != null ? formatInr(stock.dayLow) : "—"}
          </p>
        </div>
        <div className="definn-card p-4">
          <p className="text-xs text-muted-foreground">Volume</p>
          <p className="mt-1 text-lg font-semibold">
            {stock.volume.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {stock.description ? (
        <SectionCard title="About">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {stock.description}
          </p>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Price History"
        description={
          hasHistorical && hasSimulated
            ? "Historical/reference data followed by DEFINN-simulated continuation."
            : hasHistorical
              ? "Imported historical/reference OHLCV data for academic demonstration."
              : "DEFINN-generated simulated price path."
        }
      >
        <PriceHistoryChart history={history} />
      </SectionCard>

      <SectionCard title="Watchlist">
        <div className="flex flex-wrap items-center gap-3">
          <WatchlistButton symbol={stock.symbol} initialInWatchlist={inWatchlist} />
        </div>
      </SectionCard>
    </>
  );
}
