import Link from "next/link";
import { ArrowRight, Briefcase, Link2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

type PortfolioHeroCardProps = {
  portfolioValue: string;
  holdingsCount: number;
  virtualCash: string;
  unrealizedPnL: string;
  walletStatus: string;
  blockchainConnected: boolean;
  walletMissing: boolean;
};

export function PortfolioHeroCard({
  portfolioValue,
  holdingsCount,
  virtualCash,
  unrealizedPnL,
  walletStatus,
  blockchainConnected,
  walletMissing,
}: PortfolioHeroCardProps) {
  return (
    <div
      className="definn-card definn-card-glow relative overflow-hidden p-6 md:p-8"
      aria-label="Portfolio overview"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/3 size-48 rounded-full bg-chart-2/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Your DEFINN Portfolio
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              {portfolioValue}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Simulated market valuation plus on-chain virtual cash — not real money.
            </p>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Holdings</dt>
              <dd className="flex items-center gap-1.5 text-lg font-semibold">
                <Briefcase className="size-4 text-primary" aria-hidden="true" />
                {holdingsCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Virtual Cash</dt>
              <dd className="flex items-center gap-1.5 text-lg font-semibold">
                <Wallet className="size-4 text-primary" aria-hidden="true" />
                {virtualCash}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Unrealized P/L</dt>
              <dd className="text-lg font-semibold">{unrealizedPnL}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Wallet</dt>
              <dd className="flex items-center gap-1.5 text-lg font-semibold">
                <Link2 className="size-4 text-primary" aria-hidden="true" />
                {walletMissing ? "Not set up" : walletStatus}
              </dd>
            </div>
          </dl>

          <p className="text-xs text-muted-foreground">
            Blockchain:{" "}
            {blockchainConnected
              ? "DEFINN Local Network connected (Chain ID 31337)"
              : "Unavailable — start Anvil to enable on-chain features"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:flex-col">
          <Link href="/portfolio">
            <Button type="button" className="w-full sm:w-auto">
              View Portfolio
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </Link>
          {walletMissing ? (
            <Link href="/wallet">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Set Up Wallet
              </Button>
            </Link>
          ) : (
            <Link href="/markets">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Browse Markets
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
