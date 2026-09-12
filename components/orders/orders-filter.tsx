"use client";

import Link from "next/link";

import { ORDER_FILTER_OPTIONS } from "@/lib/mock/demo-data";
import { cn } from "cn";

type OrdersFilterProps = {
  activeStatus: string;
};

function toQueryValue(filter: string): string {
  if (filter === "All") {
    return "ALL";
  }

  return filter.toUpperCase();
}

function isActive(filter: string, activeStatus: string): boolean {
  return toQueryValue(filter) === activeStatus.toUpperCase();
}

export function OrdersFilter({ activeStatus }: OrdersFilterProps) {
  return (
    <div
      className="mb-3 flex flex-wrap gap-1.5"
      role="group"
      aria-label="Order status filters"
    >
      {ORDER_FILTER_OPTIONS.map((filter) => {
        const query = toQueryValue(filter);
        const href = query === "ALL" ? "/orders" : `/orders?status=${query}`;

        return (
          <Link
            key={filter}
            href={href}
            aria-pressed={isActive(filter, activeStatus)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              isActive(filter, activeStatus)
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {filter}
          </Link>
        );
      })}
    </div>
  );
}
