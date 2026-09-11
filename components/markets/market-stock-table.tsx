import Link from "next/link";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatChange, formatInr, formatPercent } from "@/lib/format/currency";
import type { MarketStock } from "@/lib/market/types";

import { WatchlistButton } from "./watchlist-button";

type MarketStockTableProps = {
  stocks: MarketStock[];
  showActions?: boolean;
  watchlistSymbols?: string[];
};

function changeClass(value: number): string {
  return value >= 0 ? "text-success" : "text-destructive";
}

export function MarketStockTable({
  stocks,
  showActions = false,
  watchlistSymbols = [],
}: MarketStockTableProps) {
  if (stocks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No stocks match your search or filter.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="hidden sm:table-cell">Exchange</TableHead>
          <TableHead className="hidden md:table-cell">Sector</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="hidden text-right md:table-cell">Change</TableHead>
          <TableHead className="text-right">Change %</TableHead>
          <TableHead className="hidden lg:table-cell">Status</TableHead>
          {showActions ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {stocks.map((stock) => (
          <TableRow
            key={stock.symbol}
            className="transition-colors hover:bg-muted/30"
          >
            <TableCell className="font-medium">
              <Link
                href={`/markets/${stock.symbol}`}
                className="hover:underline"
              >
                {stock.symbol}
              </Link>
            </TableCell>
            <TableCell>{stock.companyName}</TableCell>
            <TableCell className="hidden sm:table-cell">{stock.exchange}</TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground">
              {stock.sector ?? "—"}
            </TableCell>
            <TableCell className="text-right">{formatInr(stock.currentPrice)}</TableCell>
            <TableCell className={`hidden text-right md:table-cell ${changeClass(stock.change)}`}>
              {formatChange(stock.change)}
            </TableCell>
            <TableCell className={`text-right ${changeClass(stock.changePercent)}`}>
              {formatPercent(stock.changePercent)}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <StatusBadge status={stock.isActive ? "ACTIVE" : "INACTIVE"} />
            </TableCell>
            {showActions ? (
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                  <Link href={`/markets/${stock.symbol}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <WatchlistButton
                    symbol={stock.symbol}
                    initialInWatchlist={watchlistSymbols.includes(stock.symbol)}
                  />
                </div>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
