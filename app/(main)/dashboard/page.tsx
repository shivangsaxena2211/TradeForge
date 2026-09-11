import type { Metadata } from "next";
import { Briefcase, IndianRupee, LineChart, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

import { BlockchainActivityCard } from "@/components/dashboard/blockchain-activity-card";
import { PortfolioHeroCard } from "@/components/dashboard/portfolio-hero-card";
import { PageHeader } from "@/components/layout/page-header";
import { MarketStockTable } from "@/components/markets/market-stock-table";
import { PriceHistoryChart } from "@/components/markets/price-history-chart";
import { OrdersTable } from "@/components/orders/orders-table";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { TxHashCopy } from "@/components/shared/tx-hash-copy";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session";
import { getBlockchainStatus } from "@/lib/blockchain/status";
import { formatChange, formatInr } from "@/lib/format/currency";
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
    recentOrders = orders.slice(0, 5);
    portfolio = portfolioData;
    blockchainStatus = chainStatus;

    topMovers = stocks
      .slice()
      .sort((left, right) => right.changePercent - left.changePercent)
      .slice(0, 5);

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

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your decentralized trading simulation overview. All values are simulated — not real money or exchange data."
        badge="Academic Simulation"
      />

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
      />

      <section aria-label="Account summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Portfolio Value"
          value={
            portfolioSummary
              ? formatInr(portfolioSummary.totalPortfolioValue)
              : "—"
          }
          description={`${portfolioSummary?.holdingsCount ?? 0} holdings`}
          icon={LineChart}
          highlight
        />
        <StatCard
          title="Available Virtual Cash"
          value={cashDisplay}
          description="On-chain simulated cash from Stock.sol"
          icon={Wallet}
        />
        <StatCard
          title="Unrealized P/L"
          value={
            portfolioSummary
              ? formatChange(portfolioSummary.totalUnrealizedPnL)
              : formatInr(0)
          }
          description="Simulated market value minus cost basis"
          icon={TrendingUp}
        />
        <StatCard
          title="Holdings"
          value={String(portfolioSummary?.holdingsCount ?? 0)}
          description={
            summary
              ? `${summary.activeStocks} active simulated stocks`
              : "Simulated market catalogue"
          }
          icon={Briefcase}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title="Tracked Market Performance"
            description={
              chartSymbol
                ? `Simulated price history for ${chartSymbol} — not real NSE/BSE data.`
                : "Simulated market price history from PostgreSQL."
            }
          >
            {chartSymbol ? (
              <PriceHistoryChart history={chartHistory} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No market data available. Ensure PostgreSQL is running and seeded.
              </p>
            )}
          </SectionCard>
        </div>

        <BlockchainActivityCard
          status={blockchainStatus}
          recentTxHash={latestTxHash}
          recentTradeCount={recentTrades.length}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Top Simulated Movers"
          description="Largest percentage moves in the demo market."
        >
          {topMovers.length > 0 ? (
            <MarketStockTable stocks={topMovers} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Market summary unavailable. Check PostgreSQL connection.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Watchlist"
          description="Your saved simulated instruments."
        >
          {watchlistStocks.length > 0 ? (
            <MarketStockTable stocks={watchlistStocks} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No watchlist items yet. Browse markets to add simulated stocks.
              </p>
              <Link href="/markets">
                <Button type="button">Browse Markets</Button>
              </Link>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Recent On-chain Trades"
        description="Confirmed simulated trades synchronized from Stock.sol."
      >
        {recentTrades.length > 0 ? (
          <ul className="space-y-2">
            {recentTrades.map((trade) => {
              const txHash = trade.order.transactions[0]?.txHash ?? null;

              return (
                <li
                  key={trade.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-3 text-sm transition-colors hover:border-primary/20"
                >
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      <StatusBadge status={trade.side} />
                      {trade.stock.symbol}
                    </p>
                    <p className="text-muted-foreground">
                      {trade.quantity.toString()} shares @{" "}
                      {formatInr(Number(trade.price))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatInr(Number(trade.totalValue))}</p>
                    <p className="text-xs text-muted-foreground">
                      {trade.executedAt.toLocaleString()}
                    </p>
                    {txHash ? (
                      <div className="mt-1 flex justify-end">
                        <TxHashCopy txHash={txHash} />
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No confirmed trades yet. Open a market stock to place a simulated order.
            </p>
            <Link href="/markets">
              <Button type="button" variant="outline">Browse Markets</Button>
            </Link>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Recent Orders">
        {recentOrders.length > 0 ? (
          <OrdersTable orders={recentOrders} showTxHash={false} />
        ) : (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        )}
      </SectionCard>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <IndianRupee className="size-3.5" aria-hidden="true" />
        DEFINN market prices are simulated and are not real NSE/BSE market prices.
      </p>
    </>
  );
}
