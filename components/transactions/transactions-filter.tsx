"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

type TransactionsFilterProps = {
  activeStatus: string;
  activeType: string;
  search: string;
};

const STATUS_OPTIONS = ["ALL", "CONFIRMED", "PENDING", "FAILED"] as const;
const TYPE_OPTIONS = ["ALL", "STOCK_BUY", "STOCK_SELL"] as const;

function buildHref(
  status: string,
  type: string,
  search: string,
): string {
  const params = new URLSearchParams();

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (type !== "ALL") {
    params.set("type", type);
  }

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function TransactionsFilter({
  activeStatus,
  activeType,
  search,
}: TransactionsFilterProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(search);

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          router.push(buildHref(activeStatus, activeType, searchInput));
        }}
      >
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by tx hash or symbol"
          className="max-w-sm"
          aria-label="Search transactions"
        />
        <Button type="submit">Search</Button>
        {search ? (
          <Link href={buildHref(activeStatus, activeType, "")}>
            <Button type="button" variant="outline">Clear</Button>
          </Link>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Status filters">
          {STATUS_OPTIONS.map((status) => (
            <Link
              key={status}
              href={buildHref(status, activeType, search)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                activeStatus === status
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {status === "ALL" ? "All Status" : status}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Type filters">
          {TYPE_OPTIONS.map((type) => (
            <Link
              key={type}
              href={buildHref(activeStatus, type, search)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                activeType === type
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {type === "ALL"
                ? "All Types"
                : type === "STOCK_BUY"
                  ? "Buy"
                  : "Sell"}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
