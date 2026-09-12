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
  dense?: boolean;
  showExtended?: boolean;
};

function changeClass(value: number): string {
  return value >= 0 ? "text-success" : "text-destructive";
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }

  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }

  return String(volume);
}

export function MarketStockTable({
  stocks,
  showActions = false,
  watchlistSymbols = [],
  dense = false,
  showExtended = false,
}: MarketStockTableProps) {
  if (stocks.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        No stocks match your search or filter.
      </p>
    );
  }

  return (
    <Table className={dense ? "tf-dense-table" : undefined}>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead className={dense ? "max-w-[120px] truncate" : undefined}>
            Company
          </TableHead>
          {!dense ? (
            <TableHead className="hidden sm:table-cell">Exchange</TableHead>
          ) : null}
          {!dense ? (
            <TableHead className="hidden md:table-cell">Sector</TableHead>
          ) : null}
          <TableHead className="text-right">Price</TableHead>
          {!dense ? (
            <TableHead className="hidden text-right md:table-cell">Change</TableHead>
          ) : null}
          <TableHead className="text-right">Chg %</TableHead>
          {showExtended || dense ? (
            <>
              <TableHead className="hidden text-right sm:table-cell">High</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Low</TableHead>
              <TableHead className="hidden text-right md:table-cell">Vol</TableHead>
            </>
          ) : null}
          <TableHead className="hidden lg:table-cell">Status</TableHead>
          {showActions ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {stocks.map((stock) => (
          <TableRow
            key={stock.symbol}
            className="transition-colors hover:bg-muted/20"
          >
            <TableCell className="font-medium">
              <Link
                href={`/markets/${stock.symbol}`}
                className="hover:text-primary hover:underline"
              >
                {stock.symbol}
              </Link>
            </TableCell>
            <TableCell
              className={`text-muted-foreground ${dense ? "max-w-[120px] truncate text-xs" : ""}`}
            >
              {stock.companyName}
            </TableCell>
            {!dense ? (
              <TableCell className="hidden sm:table-cell">{stock.exchange}</TableCell>
            ) : null}
            {!dense ? (
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {stock.sector ?? "—"}
              </TableCell>
            ) : null}
            <TableCell className="text-right font-medium tabular-nums">
              {formatInr(stock.currentPrice)}
            </TableCell>
            {!dense ? (
              <TableCell
                className={`hidden text-right md:table-cell tabular-nums ${changeClass(stock.change)}`}
              >
                {formatChange(stock.change)}
              </TableCell>
            ) : null}
            <TableCell
              className={`text-right tabular-nums ${changeClass(stock.changePercent)}`}
            >
              {formatPercent(stock.changePercent)}
            </TableCell>
            {showExtended || dense ? (
              <>
                <TableCell className="hidden text-right sm:table-cell tabular-nums text-xs">
                  {stock.dayHigh !== null ? formatInr(stock.dayHigh) : "—"}
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell tabular-nums text-xs">
                  {stock.dayLow !== null ? formatInr(stock.dayLow) : "—"}
                </TableCell>
                <TableCell className="hidden text-right md:table-cell tabular-nums text-xs text-muted-foreground">
                  {formatVolume(stock.volume)}
                </TableCell>
              </>
            ) : null}
            <TableCell className="hidden lg:table-cell">
              <StatusBadge status={stock.isActive ? "ACTIVE" : "INACTIVE"} />
            </TableCell>
            {showActions ? (
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
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
