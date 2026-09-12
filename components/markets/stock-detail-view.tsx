import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { formatChange, formatInr, formatPercent } from "@/lib/format/currency";
import type { MarketStockDetail, PriceHistoryPoint } from "@/lib/market/types";

import { InteractivePriceChart } from "./interactive-price-chart";
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
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PageHeader
          title={stock.symbol}
          description={stock.companyName}
          badge={stock.isActive ? "ACTIVE" : "INACTIVE"}
        />
        <Link href="/markets">
          <Button type="button" variant="outline" size="sm">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Markets
          </Button>
        </Link>
      </div>

      <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
        DEFINN is a stock-market simulation. Prices may reference historical
        data; all future movements and trade execution are simulated. No orders
        are sent to NSE/BSE.
      </p>

      <div className="definn-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="tf-metric-label">Simulated Price</p>
          <p className="mt-0.5 text-[28px] font-bold leading-none tabular-nums">
            {formatInr(stock.currentPrice)}
          </p>
          <p className={`mt-1 text-sm font-medium ${changeClass(stock.change)}`}>
            {formatChange(stock.change)} ({formatPercent(stock.changePercent)})
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge
              status={stock.simulationStatus === "LIVE" ? "ACTIVE" : "INACTIVE"}
            />
            <span className="text-[10px] text-muted-foreground">
              {stock.exchange} · {stock.marketStatus}
            </span>
          </div>
        </div>

        <div>
          <p className="tf-metric-label">Day Range</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">
            {stock.dayLow != null ? formatInr(stock.dayLow) : "—"} –{" "}
            {stock.dayHigh != null ? formatInr(stock.dayHigh) : "—"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Open {stock.dayOpen != null ? formatInr(stock.dayOpen) : "—"}
          </p>
        </div>

        <div>
          <p className="tf-metric-label">Volume</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">
            {stock.volume.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {stock.sector ?? "—"} · {stock.priceSource}
          </p>
        </div>
      </div>

      <InteractivePriceChart
        key={stock.symbol}
        symbol={stock.symbol}
        initialHistory={history}
        compact
        heightClass="h-56"
      />

      {stock.description ? (
        <SectionCard title="About" compact>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {stock.description}
          </p>
        </SectionCard>
      ) : null}

      <SectionCard title="Watchlist" compact>
        <WatchlistButton symbol={stock.symbol} initialInWatchlist={inWatchlist} />
      </SectionCard>
    </div>
  );
}
