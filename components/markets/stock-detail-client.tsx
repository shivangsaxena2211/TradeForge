"use client";

import type { MarketStockDetail, PriceHistoryPoint } from "@/lib/market/types";

import { StockDetailView } from "./stock-detail-view";
import { TradePanel } from "@/components/trading/trade-panel";

type StockDetailClientProps = {
  stock: MarketStockDetail;
  history: PriceHistoryPoint[];
  inWatchlist: boolean;
};

export function StockDetailClient({
  stock,
  history,
  inWatchlist,
}: StockDetailClientProps) {
  return (
    <div className="grid gap-3 xl:grid-cols-[1fr_340px] xl:items-start">
      <StockDetailView
        stock={stock}
        history={history}
        inWatchlist={inWatchlist}
      />
      <aside className="definn-card sticky top-14 p-4 xl:top-16">
        <div className="mb-3 space-y-1">
          <h2 className="tf-panel-header">Trade {stock.symbol}</h2>
          <p className="text-[11px] text-muted-foreground">
            Orders are signed locally and executed on Stock.sol. Simulated
            market price is for display; on-chain price is authoritative.
          </p>
        </div>
        <TradePanel
          symbol={stock.symbol}
          marketPriceInr={stock.currentPrice}
          isActiveInDatabase={stock.isActive}
          onChainStockId={stock.onChainStockId}
        />
      </aside>
    </div>
  );
}
