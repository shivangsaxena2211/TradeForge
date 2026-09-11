"use client";

import type { MarketStockDetail, PriceHistoryPoint } from "@/lib/market/types";

import { StockDetailView } from "./stock-detail-view";
import { TradePanel } from "@/components/trading/trade-panel";
import { SectionCard } from "@/components/shared/section-card";

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
    <>
      <StockDetailView stock={stock} history={history} inWatchlist={inWatchlist} />
      <SectionCard
        title="Blockchain Execution"
        description="BUY/SELL orders are signed locally in your DEFINN Wallet and executed on Stock.sol. The simulated market price above is for display; on-chain price is authoritative at execution."
        className="definn-card-glow border-primary/20"
      >
        <TradePanel
          symbol={stock.symbol}
          marketPriceInr={stock.currentPrice}
          isActiveInDatabase={stock.isActive}
          onChainStockId={stock.onChainStockId}
        />
      </SectionCard>
    </>
  );
}
