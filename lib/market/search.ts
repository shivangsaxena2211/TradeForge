const MAX_SEARCH_LENGTH = 100;

export function normalizeSearchQuery(query: string | undefined | null): string {
  if (!query) {
    return "";
  }

  return query.trim().replace(/\s+/g, " ").slice(0, MAX_SEARCH_LENGTH);
}

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z0-9._&-]{1,20}$/.test(normalizeSymbol(symbol));
}
