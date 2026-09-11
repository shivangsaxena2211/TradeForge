"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";

type WatchlistButtonProps = {
  symbol: string;
  initialInWatchlist?: boolean;
  onChange?: (inWatchlist: boolean) => void;
};

export function WatchlistButton({
  symbol,
  initialInWatchlist = false,
  onChange,
}: WatchlistButtonProps) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleWatchlist() {
    setIsPending(true);
    setError(null);

    try {
      if (inWatchlist) {
        const response = await fetch(`/api/market/watchlist/${symbol}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to remove from watchlist.");
        }

        setInWatchlist(false);
        onChange?.(false);
      } else {
        const response = await fetch("/api/market/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to add to watchlist.");
        }

        setInWatchlist(true);
        onChange?.(true);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Watchlist update failed.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={inWatchlist ? "default" : "outline"}
        size="sm"
        disabled={isPending}
        onClick={() => void toggleWatchlist()}
        aria-pressed={inWatchlist}
      >
        <Star
          className="size-3.5"
          aria-hidden="true"
          fill={inWatchlist ? "currentColor" : "none"}
        />
        {isPending
          ? "Saving..."
          : inWatchlist
            ? "In Watchlist"
            : "Add to Watchlist"}
      </Button>
      {error ? (
        <span className="text-xs text-destructive" role="alert">{error}</span>
      ) : null}
    </div>
  );
}
