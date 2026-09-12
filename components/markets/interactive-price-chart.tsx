"use client";

import { useCallback, useState } from "react";

import { ChartCard } from "@/components/shared/chart-card";
import {
  TIMEFRAME_LIMITS,
  TimeframeTabs,
  type TimeframeKey,
} from "@/components/shared/timeframe-tabs";
import type { PriceHistoryPoint } from "@/lib/market/types";

import { PriceHistoryChart } from "./price-history-chart";

type InteractivePriceChartProps = {
  symbol: string;
  initialHistory: PriceHistoryPoint[];
  title?: string;
  description?: string;
  compact?: boolean;
  heightClass?: string;
};

export function InteractivePriceChart({
  symbol,
  initialHistory,
  title = "Market Performance",
  description,
  compact = false,
  heightClass = "h-56",
}: InteractivePriceChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("1M");
  const [history, setHistory] = useState(initialHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (tf: TimeframeKey) => {
      setLoading(true);
      setError(null);

      try {
        const limit = TIMEFRAME_LIMITS[tf];
        const response = await fetch(
          `/api/market/stocks/${encodeURIComponent(symbol)}/history?limit=${limit}&source=all`,
        );

        if (!response.ok) {
          throw new Error("Unable to load price history.");
        }

        const data = await response.json();
        setHistory(data.history ?? []);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Unable to load price history.",
        );
      } finally {
        setLoading(false);
      }
    },
    [symbol],
  );

  function handleTimeframeChange(tf: TimeframeKey) {
    setTimeframe(tf);
    void fetchHistory(tf);
  }

  return (
    <ChartCard
      title={title}
      description={
        description ??
        `Simulated price history for ${symbol} — daily data points, not real NSE/BSE ticks.`
      }
      compact={compact}
      action={<TimeframeTabs value={timeframe} onChange={handleTimeframeChange} />}
    >
      {error ? (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      ) : null}
      <PriceHistoryChart
        history={history}
        loading={loading}
        heightClass={heightClass}
        compact={compact}
      />
    </ChartCard>
  );
}
