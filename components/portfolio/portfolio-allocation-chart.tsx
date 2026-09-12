"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { formatInr, formatPercent } from "@/lib/format/currency";
import type { HoldingRow } from "@/lib/portfolio/types";

const COLORS = [
  "oklch(0.68 0.19 210)",
  "oklch(0.62 0.16 252)",
  "oklch(0.72 0.17 155)",
  "oklch(0.78 0.14 85)",
  "oklch(0.62 0.22 25)",
  "oklch(0.55 0.12 300)",
];

type PortfolioAllocationChartProps = {
  holdings: HoldingRow[];
};

export function PortfolioAllocationChart({
  holdings,
}: PortfolioAllocationChartProps) {
  const data = holdings
    .filter((h) => h.marketValue > 0 && h.allocationPercent !== null)
    .map((h) => ({
      name: h.symbol,
      value: h.marketValue,
      allocation: h.allocationPercent ?? 0,
    }));

  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        No allocation data — buy simulated shares to see distribution.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-44 w-full" role="img" aria-label="Portfolio allocation chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="transparent"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.15 0.038 264)",
                border: "1px solid oklch(0.35 0.06 264 / 35%)",
                borderRadius: "0.5rem",
                fontSize: "11px",
              }}
              formatter={(value, _name, item) => {
                const payload = item.payload as { allocation: number };
                return [
                  `${formatInr(Number(value))} (${formatPercent(payload.allocation)})`,
                  item.name,
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {data.map((item, index) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-2 rounded-md bg-surface-inset px-2 py-1 text-[11px]"
          >
            <span className="flex items-center gap-1.5 truncate font-medium">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                aria-hidden="true"
              />
              {item.name}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {formatPercent(item.allocation)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
