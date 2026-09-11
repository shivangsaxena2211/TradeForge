type DecimalLike = { toString(): string };

export function decimalToNumber(value: DecimalLike): number {
  return Number(value.toString());
}

export function calculateChange(
  currentPrice: number,
  previousClose: number,
): { change: number; changePercent: number } {
  const change = roundCurrency(currentPrice - previousClose);
  const changePercent =
    previousClose === 0
      ? 0
      : roundPercent(((currentPrice - previousClose) / previousClose) * 100);

  return { change, changePercent };
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Deterministic simulated volume for academic display — not real exchange volume.
 */
export function getSimulatedVolume(symbol: string, currentPrice: number): number {
  let hash = 0;

  for (let index = 0; index < symbol.length; index += 1) {
    hash = (hash * 31 + symbol.charCodeAt(index)) % 1_000_000;
  }

  const base = 10_000 + (hash % 90_000);
  const priceFactor = Math.max(1, Math.floor(currentPrice / 10));

  return base * priceFactor;
}
