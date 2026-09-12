"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatInr } from "@/lib/format/currency";
import type { PriceHistoryPoint } from "@/lib/market/types";

type PriceHistoryChartProps = {
  history: PriceHistoryPoint[];
  loading?: boolean;
  compact?: boolean;
  heightClass?: string;
};

const HISTORICAL_COLOR = "oklch(0.55 0.04 264)";
const SIMULATED_COLOR = "oklch(0.62 0.2 252)";

function formatAxisDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

function buildChartData(history: PriceHistoryPoint[]) {
  let lastHistoricalPrice: number | null = null;

  return history.map((point) => {
    const isHistorical = point.sourceType === "HISTORICAL";
    const isSimulated = point.sourceType === "SIMULATED";

    if (isHistorical) {
      lastHistoricalPrice = point.price;
    }

    const bridgePrice =
      isSimulated && lastHistoricalPrice !== null ? lastHistoricalPrice : null;

    return {
      ...point,
      label: formatAxisDate(point.timestamp),
      historicalPrice: isHistorical ? point.price : bridgePrice,
      simulatedPrice: isSimulated ? point.price : null,
    };
  });
}

function findSimulationStartIndex(history: PriceHistoryPoint[]): number {
  return history.findIndex((point) => point.sourceType === "SIMULATED");
}

export function PriceHistoryChart({
  history,
  loading = false,
  compact = false,
  heightClass = "h-56",
}: PriceHistoryChartProps) {
  if (loading) {
    return (
      <div
        className={`flex ${heightClass} items-center justify-center rounded-lg border border-border/60 bg-muted/10 text-xs text-muted-foreground`}
        aria-busy="true"
      >
        Loading price history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div
        className={`flex ${heightClass} items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/10 text-xs text-muted-foreground`}
      >
        No price history available yet. Import historical CSV data or start the simulation engine.
      </div>
    );
  }

  const chartData = buildChartData(history);
  const simulationStartIndex = findSimulationStartIndex(history);
  const simulationStartLabel =
    simulationStartIndex >= 0
      ? chartData[simulationStartIndex]?.label
      : undefined;

  const hasHistorical = history.some((point) => point.sourceType === "HISTORICAL");
  const hasSimulated = history.some((point) => point.sourceType === "SIMULATED");

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        {hasHistorical ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: HISTORICAL_COLOR }}
            />
            Historical / reference data
          </span>
        ) : null}
        {hasSimulated ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: SIMULATED_COLOR }}
            />
            DEFINN simulation
          </span>
        ) : null}
      </div>

      <div className={`${heightClass} w-full`} role="img" aria-label="Price history chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
          >
            <defs>
              <linearGradient id="definnSimulatedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SIMULATED_COLOR} stopOpacity={0.3} />
                <stop offset="100%" stopColor={SIMULATED_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.35 0.06 264 / 25%)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "oklch(0.68 0.03 264)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "oklch(0.68 0.03 264)" }}
              axisLine={false}
              tickLine={false}
              width={72}
              tickFormatter={(value: number) => formatInr(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.17 0.04 264)",
                border: "1px solid oklch(0.35 0.06 264 / 35%)",
                borderRadius: "0.75rem",
                fontSize: "12px",
              }}
              formatter={(value, name, item) => {
                const payload = item.payload as PriceHistoryPoint & {
                  sourceType: "HISTORICAL" | "SIMULATED";
                };

                if (value == null) {
                  return ["—", ""];
                }

                const label =
                  payload.sourceType === "HISTORICAL"
                    ? "Historical close"
                    : "Simulated price";

                return [formatInr(Number(value)), label];
              }}
              labelFormatter={(_, payload) => {
                const timestamp = payload?.[0]?.payload?.timestamp as
                  | string
                  | undefined;
                const sourceType = payload?.[0]?.payload?.sourceType as
                  | "HISTORICAL"
                  | "SIMULATED"
                  | undefined;

                const timeLabel = timestamp
                  ? new Date(timestamp).toLocaleString("en-IN")
                  : "";

                if (sourceType === "HISTORICAL") {
                  return `${timeLabel} · Historical`;
                }

                if (sourceType === "SIMULATED") {
                  return `${timeLabel} · DEFINN Simulation`;
                }

                return timeLabel;
              }}
            />
            {!compact ? (
              <Legend
                verticalAlign="top"
                height={24}
                formatter={(value) =>
                  value === "historicalPrice"
                    ? "Historical"
                    : value === "simulatedPrice"
                      ? "DEFINN Simulation"
                      : value
                }
              />
            ) : null}
            {simulationStartLabel ? (
              <ReferenceLine
                x={simulationStartLabel}
                stroke="oklch(0.55 0.12 252 / 50%)"
                strokeDasharray="4 4"
                label={{
                  value: "Simulation start",
                  position: "insideTopRight",
                  fill: "oklch(0.68 0.03 264)",
                  fontSize: 10,
                }}
              />
            ) : null}
            {hasSimulated ? (
              <Area
                type="monotone"
                dataKey="simulatedPrice"
                stroke="none"
                fill="url(#definnSimulatedFill)"
                connectNulls={false}
              />
            ) : null}
            {hasHistorical ? (
              <Line
                type="monotone"
                dataKey="historicalPrice"
                name="historicalPrice"
                stroke={HISTORICAL_COLOR}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ) : null}
            {hasSimulated ? (
              <Line
                type="monotone"
                dataKey="simulatedPrice"
                name="simulatedPrice"
                stroke={SIMULATED_COLOR}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
