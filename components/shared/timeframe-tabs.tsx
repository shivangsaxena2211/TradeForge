"use client";

import { cn } from "cn";

export type TimeframeKey = "1D" | "1W" | "1M" | "3M" | "1Y";

export const TIMEFRAME_LIMITS: Record<TimeframeKey, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
};

const TIMEFRAMES: TimeframeKey[] = ["1D", "1W", "1M", "3M", "1Y"];

type TimeframeTabsProps = {
  value: TimeframeKey;
  onChange: (value: TimeframeKey) => void;
  className?: string;
};

export function TimeframeTabs({ value, onChange, className }: TimeframeTabsProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border/60 bg-surface-inset p-0.5",
        className,
      )}
      role="tablist"
      aria-label="Chart timeframe"
    >
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          type="button"
          role="tab"
          aria-selected={value === tf}
          onClick={() => onChange(tf)}
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors motion-reduce:transition-none",
            value === tf
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
