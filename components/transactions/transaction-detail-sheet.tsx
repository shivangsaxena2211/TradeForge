"use client";

import { OrderDetailSheet } from "@/components/orders/order-detail-sheet";
import { AddressCopy } from "@/components/shared/address-copy";
import { StatusBadge } from "@/components/shared/status-badge";
import { TxHashCopy } from "@/components/shared/tx-hash-copy";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { blockchainConfig } from "@/lib/blockchain/config";
import { formatInr } from "@/lib/format/currency";
import type { OrderDetail } from "@/lib/trading/types";
import type { TransactionDetail } from "@/lib/transactions/types";
import { useState } from "react";

type TransactionDetailSheetProps = {
  transaction: TransactionDetail | null;
  open: boolean;
  isLoading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
};

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function TransactionDetailSheet({
  transaction,
  open,
  isLoading,
  error,
  onOpenChange,
}: TransactionDetailSheetProps) {
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);

  async function openRelatedOrder(orderId: string) {
    setOrderOpen(true);
    setOrderLoading(true);
    setOrderError(null);
    setOrderDetail(null);

    try {
      const response = await fetch(`/api/trading/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load order.");
      }

      setOrderDetail(data);
    } catch (caught) {
      setOrderError(
        caught instanceof Error ? caught.message : "Unable to load order.",
      );
    } finally {
      setOrderLoading(false);
    }
  }

  const blockchain = transaction?.blockchain;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
            <SheetDescription>
              Blockchain-backed simulated trade record on the DEFINN local network.
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Loading transaction...
            </p>
          ) : null}

          {error ? (
            <p className="mt-6 text-sm text-destructive" role="alert">{error}</p>
          ) : null}

          {transaction ? (
            <div className="mt-6 space-y-6 text-sm">
              <section className="space-y-3">
                <h3 className="font-medium">Transaction</h3>
                <dl className="grid gap-3">
                  <div>
                    <dt className="text-muted-foreground">Transaction Hash</dt>
                    <dd>
                      {transaction.txHash ? (
                        <TxHashCopy txHash={transaction.txHash} />
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd><StatusBadge status={transaction.status} /></dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Type</dt>
                      <dd><StatusBadge status={transaction.transactionType} /></dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-muted-foreground">Block Number</dt>
                      <dd>{transaction.blockNumber ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Timestamp</dt>
                      <dd>{formatTimestamp(transaction.confirmedAt ?? transaction.createdAt)}</dd>
                    </div>
                  </div>
                </dl>
              </section>

              <section className="space-y-3">
                <h3 className="font-medium">Blockchain</h3>
                <dl className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-muted-foreground">Network</dt>
                      <dd>{blockchainConfig.networkName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Chain ID</dt>
                      <dd>{blockchain?.chainId ?? blockchainConfig.chainId}</dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">From</dt>
                    <dd>
                      {blockchain?.from ? (
                        <AddressCopy address={blockchain.from} label="Copy from address" />
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">To</dt>
                    <dd>
                      {blockchain?.to ? (
                        <AddressCopy address={blockchain.to} label="Copy to address" />
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Verification</dt>
                    <dd>
                      {blockchain?.foundOnChain
                        ? "Confirmed on Anvil"
                        : blockchain?.historicalOnly
                          ? "Historical record"
                          : blockchain?.blockchainConnected
                            ? "Not found on current chain"
                            : "Blockchain unavailable"}
                    </dd>
                  </div>
                </dl>
                {blockchain?.message ? (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-800 dark:text-amber-200">
                    {blockchain.message}
                  </p>
                ) : null}
              </section>

              <section className="space-y-3">
                <h3 className="font-medium">Trade</h3>
                <dl className="grid gap-3">
                  <div>
                    <dt className="text-muted-foreground">Stock</dt>
                    <dd className="font-medium">
                      {transaction.symbol
                        ? `${transaction.side ?? transaction.transactionType} ${transaction.symbol}`
                        : "Application trade unavailable"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-muted-foreground">Quantity</dt>
                      <dd>{transaction.quantity ?? "—"} shares</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Order Type</dt>
                      <dd>{transaction.orderType ?? "—"}</dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-muted-foreground">Execution Price</dt>
                      <dd>
                        {transaction.executionPrice
                          ? formatInr(Number(transaction.executionPrice))
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Total</dt>
                      <dd>
                        {transaction.totalValue
                          ? formatInr(Number(transaction.totalValue))
                          : "—"}
                      </dd>
                    </div>
                  </div>
                </dl>
              </section>

              <section className="space-y-3">
                <h3 className="font-medium">Wallet</h3>
                <dl>
                  <dt className="text-muted-foreground">DEFINN Wallet Address</dt>
                  <dd>
                    {transaction.walletAddress ? (
                      <AddressCopy address={transaction.walletAddress} />
                    ) : (
                      "No wallet registered"
                    )}
                  </dd>
                </dl>
              </section>

              <section className="space-y-3">
                <h3 className="font-medium">Related Records</h3>
                <dl className="grid gap-2">
                  <div>
                    <dt className="text-muted-foreground">Order ID</dt>
                    <dd className="font-mono text-xs break-all">
                      {transaction.orderId ?? "Application order unavailable"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Trade ID</dt>
                    <dd className="font-mono text-xs break-all">
                      {transaction.tradeId ?? "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              <div className="flex flex-wrap gap-2">
                {transaction.txHash ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(transaction.txHash!)}
                  >
                    Copy Hash
                  </Button>
                ) : null}
                {transaction.walletAddress ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      navigator.clipboard.writeText(transaction.walletAddress!)
                    }
                  >
                    Copy Wallet
                  </Button>
                ) : null}
                {transaction.orderId ? (
                  <Button
                    type="button"
                    onClick={() => void openRelatedOrder(transaction.orderId!)}
                  >
                    View Related Order
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <OrderDetailSheet
        order={orderDetail}
        open={orderOpen}
        isLoading={orderLoading}
        error={orderError}
        onOpenChange={setOrderOpen}
      />
    </>
  );
}
