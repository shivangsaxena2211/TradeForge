"use client";

import { useState } from "react";
import { ListOrdered } from "lucide-react";

import { OrderDetailSheet } from "@/components/orders/order-detail-sheet";
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
import type { OrderDetail, OrderListItem } from "@/lib/trading/types";

type OrdersTableProps = {
  orders: OrderListItem[];
  showTxHash?: boolean;
};

export function OrdersTable({ orders, showTxHash = true }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function openOrderDetail(orderId: string) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedOrder(null);

    try {
      const response = await fetch(`/api/trading/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load order.");
      }

      setSelectedOrder(data);
    } catch (caught) {
      setDetailError(
        caught instanceof Error ? caught.message : "Unable to load order.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Market buy and sell orders will appear here after you trade from a stock detail page."
        icon={ListOrdered}
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stock</TableHead>
            <TableHead>Side</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="hidden text-right md:table-cell">Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Total</TableHead>
            <TableHead className="hidden xl:table-cell">Date</TableHead>
            {showTxHash ? (
              <TableHead className="hidden 2xl:table-cell">Tx Hash</TableHead>
            ) : null}
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const displayPrice =
              order.executedPrice ?? order.requestedPrice;

            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.symbol}</TableCell>
                <TableCell>
                  <StatusBadge status={order.side} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {order.orderType}
                </TableCell>
                <TableCell className="text-right">{order.quantity}</TableCell>
                <TableCell className="hidden text-right md:table-cell">
                  {formatInr(displayPrice)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="hidden text-right lg:table-cell">
                  {order.totalValue !== null
                    ? formatInr(order.totalValue)
                    : "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {new Date(order.createdAt).toLocaleString()}
                </TableCell>
                {showTxHash ? (
                  <TableCell className="hidden 2xl:table-cell">
                    {order.txHash ? (
                      <TxHashCopy txHash={order.txHash} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                ) : null}
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void openOrderDetail(order.id)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <OrderDetailSheet
        order={selectedOrder}
        open={detailOpen}
        isLoading={detailLoading}
        error={detailError}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
