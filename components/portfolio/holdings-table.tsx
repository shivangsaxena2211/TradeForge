import Link from "next/link";
import { Briefcase } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatChange, formatInr, formatPercent } from "@/lib/format/currency";
import type { HoldingRow } from "@/lib/portfolio/types";

type HoldingsTableProps = {
  holdings: HoldingRow[];
};

function pnlClass(value: number): string {
  return value >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <EmptyState
        title="No holdings yet"
        description="Confirmed trades will appear here after you buy simulated shares on a market stock page."
        icon={Briefcase}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead className="hidden md:table-cell">Name</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Avg. Buy</TableHead>
          <TableHead className="text-right">Sim. Price</TableHead>
          <TableHead className="text-right">Sim. Value</TableHead>
          <TableHead className="text-right">Unrealized P/L</TableHead>
          <TableHead className="hidden text-right lg:table-cell">P/L %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((holding) => (
          <TableRow key={holding.stockId}>
            <TableCell className="font-medium">
              <Link
                href={`/markets/${holding.symbol}`}
                className="hover:underline"
              >
                {holding.symbol}
              </Link>
              {holding.onChainMismatch ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  On-chain mismatch
                </p>
              ) : null}
            </TableCell>
            <TableCell className="hidden max-w-[12rem] truncate md:table-cell">
              {holding.companyName}
            </TableCell>
            <TableCell className="text-right">{holding.quantity}</TableCell>
            <TableCell className="hidden text-right sm:table-cell">
              {formatInr(holding.averageBuyPrice)}
            </TableCell>
            <TableCell className="text-right">
              {formatInr(holding.currentPrice)}
            </TableCell>
            <TableCell className="text-right">
              {formatInr(holding.marketValue)}
            </TableCell>
            <TableCell className={`text-right ${pnlClass(holding.unrealizedPnL)}`}>
              {formatChange(holding.unrealizedPnL)}
            </TableCell>
            <TableCell
              className={`hidden text-right lg:table-cell ${holding.pnlPercent === null ? "" : pnlClass(holding.unrealizedPnL)}`}
            >
              {holding.pnlPercent === null ? "—" : formatPercent(holding.pnlPercent)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
