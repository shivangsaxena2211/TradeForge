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
import type { DemoStock } from "@/lib/mock/demo-data";

type StockTableProps = {
  stocks: DemoStock[];
  showActions?: boolean;
};

export function StockTable({ stocks, showActions = false }: StockTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="hidden sm:table-cell">Exchange</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="hidden text-right md:table-cell">Change</TableHead>
          <TableHead className="text-right">Change %</TableHead>
          {showActions ? <TableHead className="text-right">Action</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {stocks.map((stock) => (
          <TableRow key={stock.symbol}>
            <TableCell className="font-medium">{stock.symbol}</TableCell>
            <TableCell>{stock.companyName}</TableCell>
            <TableCell className="hidden sm:table-cell">{stock.exchange}</TableCell>
            <TableCell className="text-right">{formatInr(stock.price)}</TableCell>
            <TableCell
              className={`hidden text-right md:table-cell ${
                stock.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatChange(stock.change)}
            </TableCell>
            <TableCell
              className={`text-right ${
                stock.changePercent >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatPercent(stock.changePercent)}
            </TableCell>
            {showActions ? (
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" disabled>
                    View
                  </Button>
                  <Button size="sm" disabled title="Trading unavailable in UI shell phase">
                    Buy
                  </Button>
                </div>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
