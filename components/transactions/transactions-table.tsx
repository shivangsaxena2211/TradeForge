"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import Link from "next/link";

import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { TxHashCopy } from "@/components/shared/tx-hash-copy";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInr } from "@/lib/format/currency";
import type { TransactionDetail, TransactionListItem } from "@/lib/transactions/types";

type TransactionsTableProps = {
  transactions: TransactionListItem[];
};

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function openTransactionDetail(transactionId: string) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedTransaction(null);

    try {
      const response = await fetch(`/api/transactions/${transactionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load transaction.");
      }

      setSelectedTransaction(data);
    } catch (caught) {
      setDetailError(
        caught instanceof Error
          ? caught.message
          : "Unable to load transaction.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="No blockchain transactions yet"
          description="Confirmed simulated stock trades will appear here."
          icon={Link2}
        />
        <div className="flex justify-center">
          <Link href="/markets">
            <Button type="button">Explore Markets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {transactions.map((transaction) => (
          <article
            key={transaction.id}
            className="rounded-lg border p-4 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <StatusBadge status={transaction.transactionType} />
              <StatusBadge status={transaction.status} />
            </div>
            <p className="mt-2 font-medium">
              {transaction.symbol ?? "—"} · {transaction.quantity ?? "—"} shares
            </p>
            <p className="text-muted-foreground">
              {transaction.executionPrice
                ? formatInr(Number(transaction.executionPrice))
                : "—"}
              {transaction.totalValue
                ? ` · ${formatInr(Number(transaction.totalValue))}`
                : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Block {transaction.blockNumber ?? "—"} ·{" "}
              {new Date(transaction.createdAt).toLocaleString()}
            </p>
            {transaction.txHash ? (
              <div className="mt-2">
                <TxHashCopy txHash={transaction.txHash} />
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void openTransactionDetail(transaction.id)}
            >
              View Details
            </Button>
          </article>
        ))}
      </div>

      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Price</TableHead>
            <TableHead className="hidden text-right xl:table-cell">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Block</TableHead>
            <TableHead className="hidden xl:table-cell">Tx Hash</TableHead>
            <TableHead className="hidden 2xl:table-cell">Date</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <StatusBadge status={transaction.transactionType} />
              </TableCell>
              <TableCell className="font-medium">
                {transaction.symbol ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {transaction.quantity ?? "—"}
              </TableCell>
              <TableCell className="hidden text-right lg:table-cell">
                {transaction.executionPrice
                  ? formatInr(Number(transaction.executionPrice))
                  : "—"}
              </TableCell>
              <TableCell className="hidden text-right xl:table-cell">
                {transaction.totalValue
                  ? formatInr(Number(transaction.totalValue))
                  : "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={transaction.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {transaction.blockNumber ?? "—"}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {transaction.txHash ? (
                  <TxHashCopy txHash={transaction.txHash} />
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="hidden text-muted-foreground 2xl:table-cell">
                {new Date(transaction.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void openTransactionDetail(transaction.id)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TransactionDetailSheet
        transaction={selectedTransaction}
        open={detailOpen}
        isLoading={detailLoading}
        error={detailError}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
