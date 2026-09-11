import type { HoldingRow } from "@/lib/portfolio/types";
import { formatInr, formatPercent } from "@/lib/format/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AllocationTableProps = {
  holdings: HoldingRow[];
};

export function AllocationTable({ holdings }: AllocationTableProps) {
  const rows = holdings.filter(
    (holding) => holding.allocationPercent !== null && holding.marketValue > 0,
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead className="text-right">Sim. Market Value</TableHead>
          <TableHead className="text-right">Allocation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((holding) => (
          <TableRow key={holding.stockId}>
            <TableCell className="font-medium">{holding.symbol}</TableCell>
            <TableCell className="text-right">
              {formatInr(holding.marketValue)}
            </TableCell>
            <TableCell className="text-right">
              {holding.allocationPercent === null
                ? "—"
                : formatPercent(holding.allocationPercent)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
