import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { BlockchainStatusBadge } from "@/components/transactions/blockchain-status-badge";
import { TransactionsFilter } from "@/components/transactions/transactions-filter";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { requireAuth } from "@/lib/auth/session";
import { isBlockchainConnected } from "@/lib/blockchain/status";
import { getTransactionListForUser } from "@/lib/transactions/service";
import type {
  TransactionFilterStatus,
  TransactionFilterType,
} from "@/lib/transactions/types";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Link2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Transactions",
};

type TransactionsPageProps = {
  searchParams: Promise<{
    status?: string;
    type?: string;
    search?: string;
    page?: string;
  }>;
};

const VALID_STATUS = new Set([
  "ALL",
  "CONFIRMED",
  "FAILED",
  "PENDING",
]);

const VALID_TYPE = new Set(["ALL", "STOCK_BUY", "STOCK_SELL"]);

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const user = await requireAuth();
  const params = await searchParams;

  const statusParam = (params.status ?? "ALL").toUpperCase();
  const typeParam = (params.type ?? "ALL").toUpperCase();
  const status = VALID_STATUS.has(statusParam)
    ? (statusParam as TransactionFilterStatus)
    : "ALL";
  const type = VALID_TYPE.has(typeParam)
    ? (typeParam as TransactionFilterType)
    : "ALL";
  const search = params.search?.trim() ?? "";
  const page = Number(params.page ?? "1");

  let result = null;
  let blockchainConnected = false;

  try {
    [result, blockchainConnected] = await Promise.all([
      getTransactionListForUser(user.id, {
        status,
        type,
        search,
        page: Number.isFinite(page) && page > 0 ? page : 1,
      }),
      isBlockchainConnected(),
    ]);
  } catch (error) {
    console.error("Transactions page load failed:", error);
  }

  const summary = result?.summary ?? {
    totalTransactions: 0,
    confirmedCount: 0,
    buyCount: 0,
    sellCount: 0,
  };

  return (
    <>
      <PageHeader
        title="Transaction History"
        description="Blockchain-backed record of your simulated stock trades."
        badge="Blockchain-backed"
        actions={<BlockchainStatusBadge connected={blockchainConnected} />}
      />

      <section
        aria-label="Transaction summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Total Transactions"
          value={String(summary.totalTransactions)}
          description="PostgreSQL historical projection"
          icon={Link2}
        />
        <StatCard
          title="Confirmed"
          value={String(summary.confirmedCount)}
          description="Confirmed on DEFINN Local Network"
          icon={CheckCircle2}
        />
        <StatCard
          title="Buy Transactions"
          value={String(summary.buyCount)}
          description="STOCK_BUY records"
          icon={ArrowDownLeft}
        />
        <StatCard
          title="Sell Transactions"
          value={String(summary.sellCount)}
          description="STOCK_SELL records"
          icon={ArrowUpRight}
        />
      </section>

      <SectionCard
        title="Transactions"
        description="Each confirmed simulated trade is linked to a blockchain transaction hash and block number when available."
      >
        <TransactionsFilter
          activeStatus={status}
          activeType={type}
          search={search}
        />
        <TransactionsTable transactions={result?.transactions ?? []} />
      </SectionCard>

      {!blockchainConnected ? (
        <p className="text-sm text-muted-foreground">
          Blockchain currently unavailable. Historical PostgreSQL records remain visible, but live on-chain verification is disabled.
        </p>
      ) : null}
    </>
  );
}
