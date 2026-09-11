"use client";

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
import { formatInr } from "@/lib/format/currency";
import type { OrderDetail } from "@/lib/trading/types";

type OrderDetailSheetProps = {
  order: OrderDetail | null;
  open: boolean;
  isLoading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailSheet({
  order,
  open,
  isLoading,
  error,
  onOpenChange,
}: OrderDetailSheetProps) {
  const transaction = order?.transactions[0] ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Order Details</SheetTitle>
          <SheetDescription>
            Order, trade, and blockchain confirmation information.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading order...</p>
        ) : null}

        {error ? (
          <p className="mt-6 text-sm text-destructive" role="alert">{error}</p>
        ) : null}

        {order ? (
          <dl className="mt-6 grid gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Stock</dt>
              <dd className="font-medium">
                {order.side} {order.symbol} — {order.companyName}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground">Order Type</dt>
                <dd>{order.orderType}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={order.status} />
                </dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground">Quantity</dt>
                <dd>{order.quantity} shares</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Requested Price</dt>
                <dd>{formatInr(order.requestedPrice)}</dd>
              </div>
            </div>
            {order.executedPrice !== null ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-muted-foreground">Execution Price</dt>
                  <dd>{formatInr(order.executedPrice)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Total Value</dt>
                  <dd>
                    {order.totalValue !== null
                      ? formatInr(order.totalValue)
                      : "—"}
                  </dd>
                </div>
              </div>
            ) : null}
            {order.trade ? (
              <div>
                <dt className="text-muted-foreground">Trade Executed</dt>
                <dd>{new Date(order.trade.executedAt).toLocaleString()}</dd>
              </div>
            ) : null}
            {transaction ? (
              <>
                <div>
                  <dt className="text-muted-foreground">Transaction Status</dt>
                  <dd>
                    <StatusBadge status={transaction.status} />
                  </dd>
                </div>
                {transaction.txHash ? (
                  <div>
                    <dt className="text-muted-foreground">Transaction Hash</dt>
                    <dd>
                      <TxHashCopy txHash={transaction.txHash} />
                    </dd>
                  </div>
                ) : null}
                {transaction.blockNumber ? (
                  <div>
                    <dt className="text-muted-foreground">Block Number</dt>
                    <dd>{transaction.blockNumber}</dd>
                  </div>
                ) : null}
              </>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(order.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        ) : null}

        <div className="mt-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
