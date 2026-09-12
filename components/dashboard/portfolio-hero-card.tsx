import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type PortfolioHeroCardProps = {
  portfolioValue: string;
  holdingsCount: number;
  virtualCash: string;
  unrealizedPnL: string;
  walletStatus: string;
  blockchainConnected: boolean;
  walletMissing: boolean;
  activeStocks?: number;
  simulationStatus?: string;
};

export function PortfolioHeroCard({
  portfolioValue,
  holdingsCount,
  virtualCash,
  unrealizedPnL,
  walletStatus,
  blockchainConnected,
  walletMissing,
  activeStocks,
  simulationStatus,
}: PortfolioHeroCardProps) {
  return (
    <div
      className="definn-card relative overflow-hidden p-4"
      aria-label="Portfolio overview"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="tf-metric-label">Portfolio Overview</p>
          <p className="text-[28px] font-bold leading-none tracking-tight tabular-nums md:text-[32px]">
            {portfolioValue}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Simulated valuation — not real money or exchange execution.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/portfolio">
            <Button type="button" size="sm">
              Portfolio
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </Link>
          {walletMissing ? (
            <Link href="/wallet">
              <Button type="button" variant="outline" size="sm">
                Set Up Wallet
              </Button>
            </Link>
          ) : (
            <Link href="/markets">
              <Button type="button" variant="outline" size="sm">
                Trade
              </Button>
            </Link>
          )}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border/40 pt-3 sm:grid-cols-4">
        <div>
          <dt className="tf-metric-label">Holdings</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">{holdingsCount}</dd>
        </div>
        <div>
          <dt className="tf-metric-label">Virtual Cash</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">{virtualCash}</dd>
        </div>
        <div>
          <dt className="tf-metric-label">Unrealized P/L</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">{unrealizedPnL}</dd>
        </div>
        <div>
          <dt className="tf-metric-label flex items-center gap-1">
            <Link2 className="size-3" aria-hidden="true" />
            Wallet / Chain
          </dt>
          <dd className="mt-0.5 text-sm font-semibold">
            {walletMissing ? "Not set up" : walletStatus}
            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
              · {blockchainConnected ? "Chain 31337" : "Offline"}
            </span>
          </dd>
        </div>
      </dl>

      {activeStocks !== undefined || simulationStatus ? (
        <p className="mt-2 text-[10px] text-muted-foreground">
          {activeStocks !== undefined
            ? `${activeStocks} active simulated instruments`
            : null}
          {activeStocks !== undefined && simulationStatus ? " · " : null}
          {simulationStatus ? `Simulation ${simulationStatus}` : null}
        </p>
      ) : null}
    </div>
  );
}
