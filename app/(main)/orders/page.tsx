import type { Metadata } from "next";

import { OrdersFilter } from "@/components/orders/orders-filter";
import { OrdersTable } from "@/components/orders/orders-table";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import { requireAuth } from "@/lib/auth/session";
import { getOrderListForUser } from "@/lib/trading/service";

export const metadata: Metadata = {
  title: "Orders",
};

type OrdersPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const VALID_STATUSES = new Set([
  "ALL",
  "PENDING",
  "EXECUTED",
  "FAILED",
  "CANCELLED",
]);

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await requireAuth();
  const params = await searchParams;
  const statusParam = (params.status ?? "ALL").toUpperCase();
  const status = VALID_STATUSES.has(statusParam)
    ? (statusParam as OrderStatus | "ALL")
    : "ALL";

  let orders: Awaited<ReturnType<typeof getOrderListForUser>> = [];

  try {
    orders = await getOrderListForUser(user.id, status);
  } catch (error) {
    console.error("Orders page load failed:", error);
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="View and filter your simulated buy and sell orders from PostgreSQL."
        badge="Order History"
      />

      <SectionCard title="Order History">
        <OrdersFilter activeStatus={status} />
        <OrdersTable orders={orders} />
      </SectionCard>
    </>
  );
}
