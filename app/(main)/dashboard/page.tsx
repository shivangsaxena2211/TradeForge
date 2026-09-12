import type { Metadata } from "next";
import { Activity, BarChart3, Layers, TrendingUp } from "lucide-react";
import Link from "next/link";

import { BlockchainActivityCard } from "@/components/dashboard/blockchain-activity-card";
import { PortfolioHeroCard } from "@/components/dashboard/portfolio-hero-card";
import { PageHeader } from "@/components/layout/page-header";
import { InteractivePriceChart } from "@/components/markets/interactive-price-chart";
import { MarketStockTable } from "@/components/markets/market-stock-table";
import { OrdersTable } from "@/components/orders/orders-table";
import { PortfolioAllocationChart } from "@/components/portfolio/portfolio-allocation-chart";
import { DashboardMetricCard } from "@/components/shared/dashboard-metric-card";
import { SectionCard } from "@/components/shared/section-card";
import { TxHashCopy } from "@/components/shared/tx-hash-copy";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session";
import { getBlockchainStatus } from "@/lib/blockchain/status";
import { formatChange, formatInr, formatPercent } from "@/lib/format/currency";
import {
  getMarketSummary,
  getPriceHistory,
  getUserWatchlist,
  listStocks,
} from "@/lib/market/service";
import type { MarketStock } from "@/lib/market/types";
import { getPortfolioForUser } from "@/lib/portfolio/service";
import {
  getOrderListForUser,
  getRecentTradesForUser,
} from "@/lib/trading/service";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireAuth();

  let summary = null;
  let watchlistStocks: MarketStock[] = [];
  let topMovers: MarketStock[] = [];
  let recentTrades: Awaited<ReturnType<typeof getRecentTradesForUser>> = [];
  let recentOrders: Awaited<ReturnType<typeof getOrderListForUser>> = [];
  let allOrders: Awaited<ReturnType<typeof getOrderListForUser>> = [];
  let portfolio: Awaited<ReturnType<typeof getPortfolioForUser>> | null = null;
  let blockchainStatus: Awaited<ReturnType<typeof getBlockchainStatus>> | null =
    null;
  let chartSymbol: string | null = null;
  let chartHistory: Awaited<ReturnType<typeof getPriceHistory>> = [];

  try {
    const [
      marketSummary,
      watchlist,
      stocks,
      trades,
      orders,
      portfolioData,
      chainStatus,
    ] = await Promise.all([
      getMarketSummary(),
      getUserWatchlist(user.id),
      listStocks(),
      getRecentTradesForUser(user.id, 5),
      getOrderListForUser(user.id, "ALL"),
      getPortfolioForUser(user.id),
      getBlockchainStatus(),
    ]);

    summary = marketSummary;
    recentTrades = trades;
    allOrders = orders;
    recentOrders = orders.slice(0, 5);
    portfolio = portfolioData;
    blockchainStatus = chainStatus;

    topMovers = stocks
      .slice()
      .sort((left, right) => right.changePercent - left.changePercent)
      .slice(0, 6);

    const watchlistSymbols = new Set(watchlist.map((item) => item.symbol));
    watchlistStocks = stocks.filter((stock) =>
      watchlistSymbols.has(stock.symbol),
    );

    const chartTarget =
      watchlistStocks[0]?.symbol ?? topMovers[0]?.symbol ?? stocks[0]?.symbol;

    if (chartTarget) {
      chartSymbol = chartTarget;
      chartHistory = await getPriceHistory(chartTarget, 30);
    }
  } catch (error) {
    console.error("Dashboard market snapshot failed:", error);
  }

  const portfolioSummary = portfolio?.summary;
  const holdings = portfolio?.holdings ?? [];
  const cashDisplay =
    portfolioSummary?.onChainVirtualCash !== null &&
    portfolioSummary?.onChainVirtualCash !== undefined
      ? formatInr(portfolioSummary.onChainVirtualCash)
      : portfolioSummary?.blockchainConnected === false
        ? "Unavailable"
        : portfolioSummary?.walletMissing
          ? "No wallet"
          : "Unavailable";

  const walletStatus =
    portfolioSummary?.walletMissing
      ? "Not configured"
      : portfolioSummary?.blockchainConnected === false
        ? "Offline"
        : "Ready";

  const latestTxHash =
    recentTrades[0]?.order.transactions[0]?.txHash ?? null;

  const pendingOrders = allOrders.filter((o) => o.status === "PENDING").length;
  const topGainer = topMovers[0];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Market & portfolio overview — simulated data only, not real exchange execution."
        badge="Simulation Only"
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <PortfolioHeroCard
          portfolioValue={
            portfolioSummary
              ? formatInr(portfolioSummary.totalPortfolioValue)
              : "—"
          }
          holdingsCount={portfolioSummary?.holdingsCount ?? 0}
          virtualCash={cashDisplay}
          unrealizedPnL={
            portfolioSummary
              ? formatChange(portfolioSummary.totalUnrealizedPnL)
              : formatInr(0)
          }
          walletStatus={walletStatus}
          blockchainConnected={portfolioSummary?.blockchainConnected ?? false}
          walletMissing={portfolioSummary?.walletMissing ?? true}
          activeStocks={summary?.activeStocks}
          simulationStatus={summary?.simulationStatus}
        />

        <section
          aria-label="Market snapshot"
          className="grid grid-cols-2 gap-2 content-start"
        >
          <DashboardMetricCard
            title="Invested Value"
            value={
              portfolioSummary
                ? formatInr(portfolioSummary.totalCostBasis)
                : "—"
            }
            description="Total cost basis"
            icon={Layers}
          />
          <DashboardMetricCard
            title="Holdings Value"
            value={
              portfolioSummary
                ? formatInr(portfolioSummary.totalMarketValue)
                : "—"
            }
            description="Simulated market value"
            icon={BarChart3}
          />
          <DashboardMetricCard
            title="Active Stocks"
            value={String(summary?.activeStocks ?? "—")}
            description={summary?.marketRegime ?? "Market regime"}
            icon={Activity}
          />
          <DashboardMetricCard
            title="Top Mover"
            value={topGainer ? topGainer.symbol : "—"}
            trend={
              topGainer ? formatPercent(topGainer.changePercent) : undefined
            }
            trendPositive={topGainer ? topGainer.changePercent >= 0 : undefined}
            description={topGainer?.companyName}
            icon={TrendingUp}
          />
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {chartSymbol ? (
            <InteractivePriceChart
              key={chartSymbol}
              symbol={chartSymbol}
              initialHistory={chartHistory}
              compact
              heightClass="h-52"
            />
          ) : (
            <SectionCard title="Market Performance" compact>
              <p className="text-xs text-muted-foreground">
                No market data available. Ensure PostgreSQL is running and seeded.
              </p>
            </SectionCard>
          )}
        </div>
        <BlockchainActivityCard
          status={blockchainStatus}
          recentTxHash={latestTxHash}
          recentTradeCount={recentTrades.length}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <SectionCard
          title="Top Movers"
          description="Largest simulated percentage moves."
          compact
          className="lg:col-span-1"
        >
          {topMovers.length > 0 ? (
            <MarketStockTable stocks={topMovers} dense />
          ) : (
            <p className="text-xs text-muted-foreground">Market data unavailable.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Watchlist"
          description="Saved instruments."
          compact
          className="lg:col-span-1"
        >
          {watchlistStocks.length > 0 ? (
            <MarketStockTable stocks={watchlistStocks} dense />
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">No watchlist items yet.</p>
              <Link href="/markets">
                <Button type="button" size="sm" variant="outline">
                  Browse Markets
                </Button>
              </Link>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Portfolio Allocation"
          description="Holdings distribution by market value."
          compact
          className="lg:col-span-1"
        >
          <PortfolioAllocationChart holdings={holdings} />
        </SectionCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <SectionCard
          title="Recent Trades"
          description="Confirmed on-chain simulated trades."
          compact
        >
          {recentTrades.length > 0 ? (
            <ul className="divide-y divide-border/40">
              {recentTrades.map((trade) => {
                const txHash = trade.order.transactions[0]?.txHash ?? null;

                return (
                  <li
                    key={trade.id}
                    className="flex items-center justify-between gap-2 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-medium">
                        <StatusBadge status={trade.side} />
                        {trade.stock.symbol}
                      </p>
                      <p className="text-muted-foreground">
                        {trade.quantity.toString()} @ {formatInr(Number(trade.price))}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold tabular-nums">
                        {formatInr(Number(trade.totalValue))}
                      </p>
                      {txHash ? <TxHashCopy txHash={txHash} /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No confirmed trades yet.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Orders"
          description={`${pendingOrders} pending · ${allOrders.length} total`}
          compact
        >
          {recentOrders.length > 0 ? (
            <OrdersTable orders={recentOrders} showTxHash={false} compact />
          ) : (
            <p className="text-xs text-muted-foreground">No orders yet.</p>
          )}
        </SectionCard>
      </div>

      <p className="text-[10px] text-muted-foreground">
        DEFINN market prices are simulated and are not real NSE/BSE market prices.
        No real money. No real exchange execution.
      </p>
    </>
  );
}
