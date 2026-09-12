import type { Metadata } from "next";
import { Briefcase, IndianRupee, LineChart, Wallet } from "lucide-react";
import Link from "next/link";

import { AllocationTable } from "@/components/portfolio/allocation-table";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { PortfolioAllocationChart } from "@/components/portfolio/portfolio-allocation-chart";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { DashboardMetricCard } from "@/components/shared/dashboard-metric-card";
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
        description="Simulated holdings valued using PostgreSQL market prices. Cost basis from confirmed blockchain trades."
        badge="Simulated"
      />

      {summary?.walletMissing ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Register a DEFINN wallet to read on-chain virtual cash and compare holdings.
          <Link href="/wallet" className="ml-2 underline">
            Go to Wallet
          </Link>
        </p>
      ) : null}

      {summary?.blockchainStaleWarning ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          PostgreSQL holdings may not match the current Anvil blockchain state.
        </p>
      ) : null}

      <section
        aria-label="Portfolio summary"
        className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
      >
        <DashboardMetricCard
          title="Portfolio Value"
          value={summary ? formatInr(summary.totalPortfolioValue) : "—"}
          description={`${summary?.holdingsCount ?? 0} holdings`}
          icon={LineChart}
        />
        <DashboardMetricCard
          title="Available Cash"
          value={cashValue}
          description="On-chain virtual cash"
          icon={Wallet}
        />
        <DashboardMetricCard
          title="Invested Value"
          value={summary ? formatInr(summary.totalCostBasis) : "—"}
          description="Remaining cost basis"
          icon={IndianRupee}
        />
        <DashboardMetricCard
          title="Unrealized P/L"
          value={pnlValue}
          description="Market value minus cost"
          icon={Briefcase}
        />
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <SectionCard
          title="Holdings"
          description="Quantity, avg. price, current price, P/L."
          compact
          className="lg:col-span-2"
        >
          <HoldingsTable holdings={holdings} />
        </SectionCard>

        <SectionCard
          title="Allocation"
          description="Distribution by market value."
          compact
        >
          <PortfolioAllocationChart holdings={holdings} />
          {holdings.length > 0 ? (
            <div className="mt-3 border-t border-border/40 pt-3">
              <AllocationTable holdings={holdings} />
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">No holdings yet.</p>
              <Link href="/markets">
                <Button type="button" size="sm">Browse Markets</Button>
              </Link>
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
