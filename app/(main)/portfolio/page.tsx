import type { Metadata } from "next";
import { Briefcase, IndianRupee, LineChart, Wallet } from "lucide-react";
import Link from "next/link";

import { AllocationTable } from "@/components/portfolio/allocation-table";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session";
import { formatChange, formatInr } from "@/lib/format/currency";
import { getPortfolioForUser } from "@/lib/portfolio/service";

export const metadata: Metadata = {
  title: "Portfolio",
};

export default async function PortfolioPage() {
  const user = await requireAuth();

  let portfolio = null;

  try {
    portfolio = await getPortfolioForUser(user.id);
  } catch (error) {
    console.error("Portfolio page load failed:", error);
  }

  const summary = portfolio?.summary;
  const holdings = portfolio?.holdings ?? [];

  const cashValue =
    summary?.onChainVirtualCash !== null &&
    summary?.onChainVirtualCash !== undefined
      ? formatInr(summary.onChainVirtualCash)
      : summary?.blockchainConnected === false
        ? "Unavailable"
        : summary?.walletMissing
          ? "No wallet"
          : "Unavailable";

  const pnlValue =
    summary !== undefined && summary !== null
      ? formatChange(summary.totalUnrealizedPnL)
      : formatInr(0);

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Simulated holdings valued using PostgreSQL market prices. Cost basis comes from confirmed blockchain trades."
        badge="Simulated Valuation"
      />

      {summary?.walletMissing ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Register a DEFINN wallet to read on-chain virtual cash and compare holdings.
          <Link href="/wallet" className="ml-2 underline">
            Go to Wallet
          </Link>
        </p>
      ) : null}

      {summary?.blockchainStaleWarning ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          PostgreSQL holdings may not match the current Anvil blockchain state. After an Anvil reset, historical database records can remain while on-chain state is cleared.
        </p>
      ) : null}

      <section aria-label="Portfolio summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Portfolio Value"
          value={
            summary
              ? formatInr(summary.totalPortfolioValue)
              : "—"
          }
          description={`${summary?.holdingsCount ?? 0} holdings · simulated market value plus on-chain virtual cash.`}
          icon={LineChart}
        />
        <StatCard
          title="On-chain Virtual Cash"
          value={cashValue}
          description="Simulated trading cash from Stock.sol — not real INR or ETH."
          icon={Wallet}
        />
        <StatCard
          title="Total Invested Value"
          value={
            summary ? formatInr(summary.totalCostBasis) : "—"
          }
          description="Remaining cost basis from confirmed blockchain trades."
          icon={IndianRupee}
        />
        <StatCard
          title="Unrealized P/L"
          value={pnlValue}
          description="Simulated market value minus remaining cost basis."
          icon={Briefcase}
        />
      </section>

      <SectionCard
        title="Holdings"
        description="Current simulated market value uses PostgreSQL prices. Average buy price comes from confirmed trade execution."
      >
        <HoldingsTable holdings={holdings} />
      </SectionCard>

      {holdings.length > 0 ? (
        <SectionCard
          title="Portfolio Allocation"
          description="Share of total simulated market value by holding."
        >
          <AllocationTable holdings={holdings} />
        </SectionCard>
      ) : (
        <SectionCard title="Portfolio Allocation">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No holdings to allocate yet.
            </p>
            <Link href="/markets">
              <Button type="button">Browse Markets</Button>
            </Link>
          </div>
        </SectionCard>
      )}

      <p className="text-xs text-muted-foreground">
        Current portfolio valuation uses simulated PostgreSQL market prices, while trade cost basis comes from confirmed blockchain execution prices.
      </p>
    </>
  );
}
