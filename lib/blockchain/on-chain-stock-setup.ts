import type { Contract } from "ethers";

import { paiseToInrString } from "@/lib/trading/precision";

export type OnChainStockSnapshot = {
  stockId: number;
  symbol: string;
  name: string;
  pricePaise: bigint;
  active: boolean;
};

export type DatabaseStockForSetup = {
  id: string;
  symbol: string;
  exchange: string;
  companyName: string;
  currentPrice: { toString(): string };
  isActive: boolean;
  simulationEnabled: boolean;
  onChainStockId: number | null;
};

export type SetupMappingRow = {
  symbol: string;
  exchange: string;
  dbId: string;
  onChainStockId: number;
  action:
    | "created"
    | "mapped"
    | "remapped"
    | "price-updated"
    | "deactivated"
    | "skipped";
  detail?: string;
};

export type SetupResult = {
  rows: SetupMappingRow[];
  errors: string[];
};

export type VerifyMappingRow = {
  symbol: string;
  exchange: string;
  dbId: string;
  onChainStockId: number | null;
  status: "PASS" | "FAIL";
  detail: string;
};

export type VerifyResult = {
  rows: VerifyMappingRow[];
  passed: number;
  failed: number;
};

export function inrToPaise(priceInr: number): bigint {
  if (!Number.isFinite(priceInr) || priceInr <= 0) {
    throw new Error(`Invalid INR price: ${priceInr}`);
  }

  return BigInt(Math.round(priceInr * 100));
}

export function normalizeOnChainSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function stockIdentityKey(exchange: string, symbol: string): string {
  return `${exchange.trim().toUpperCase()}:${normalizeOnChainSymbol(symbol)}`;
}

export function buildOnChainIdIndex(
  symbolIndex: Map<string, OnChainStockSnapshot>,
): Map<number, OnChainStockSnapshot> {
  const idIndex = new Map<number, OnChainStockSnapshot>();

  for (const snapshot of symbolIndex.values()) {
    idIndex.set(snapshot.stockId, snapshot);
  }

  return idIndex;
}

export type MappingResolution =
  | {
      kind: "ok";
      onChainStockId: number;
      needsRemap: boolean;
      detail?: string;
    }
  | {
      kind: "error";
      message: string;
    };

export function resolveCanonicalOnChainStockId(
  stock: DatabaseStockForSetup,
  symbolIndex: Map<string, OnChainStockSnapshot>,
  idIndex: Map<number, OnChainStockSnapshot>,
): MappingResolution {
  const normalizedSymbol = normalizeOnChainSymbol(stock.symbol);
  const bySymbol = symbolIndex.get(normalizedSymbol);

  if (!bySymbol) {
    return {
      kind: "error",
      message: `On-chain instrument not found for ${stock.exchange}:${stock.symbol}.`,
    };
  }

  if (!verifySymbolMatch(stock.symbol, bySymbol.symbol)) {
    return {
      kind: "error",
      message: `Symbol mismatch for ${stock.exchange}:${stock.symbol} — on-chain symbol is ${bySymbol.symbol}.`,
    };
  }

  if (stock.onChainStockId === null) {
    return {
      kind: "ok",
      onChainStockId: bySymbol.stockId,
      needsRemap: false,
    };
  }

  if (stock.onChainStockId === bySymbol.stockId) {
    return {
      kind: "ok",
      onChainStockId: bySymbol.stockId,
      needsRemap: false,
    };
  }

  const atStoredId = idIndex.get(stock.onChainStockId);

  if (atStoredId && !verifySymbolMatch(atStoredId.symbol, stock.symbol)) {
    return {
      kind: "ok",
      onChainStockId: bySymbol.stockId,
      needsRemap: true,
      detail: `Remapped stale onChainStockId ${stock.onChainStockId} (${atStoredId.symbol}) → ${bySymbol.stockId} for ${stock.exchange}:${stock.symbol}.`,
    };
  }

  if (!atStoredId) {
    return {
      kind: "ok",
      onChainStockId: bySymbol.stockId,
      needsRemap: true,
      detail: `Remapped missing on-chain ID ${stock.onChainStockId} → ${bySymbol.stockId} for ${stock.exchange}:${stock.symbol}.`,
    };
  }

  return {
    kind: "ok",
    onChainStockId: bySymbol.stockId,
    needsRemap: true,
    detail: `Aligned onChainStockId ${stock.onChainStockId} → ${bySymbol.stockId} for ${stock.exchange}:${stock.symbol}.`,
  };
}

export async function scanOnChainStocks(
  contract: Contract,
): Promise<Map<string, OnChainStockSnapshot>> {
  const stockCount = Number(await contract.stockCount());
  const index = new Map<string, OnChainStockSnapshot>();

  for (let stockId = 1; stockId <= stockCount; stockId += 1) {
    const [id, symbol, name, price, active] = await contract.getStock(stockId);
    const normalized = normalizeOnChainSymbol(String(symbol));

    index.set(normalized, {
      stockId: Number(id),
      symbol: String(symbol),
      name: String(name),
      pricePaise: BigInt(price.toString()),
      active: Boolean(active),
    });
  }

  return index;
}

export function verifySymbolMatch(
  databaseSymbol: string,
  onChainSymbol: string,
): boolean {
  return (
    normalizeOnChainSymbol(databaseSymbol) ===
    normalizeOnChainSymbol(onChainSymbol)
  );
}

function isNonceError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("nonce") ||
    message.includes("replacement transaction underpriced")
  );
}

async function sendAndConfirm(
  contract: Contract,
  send: () => Promise<{ wait: () => Promise<unknown> }>,
  retries = 4,
): Promise<void> {
  let attempt = 0;

  while (attempt < retries) {
    try {
      const tx = await send();
      await tx.wait();
      return;
    } catch (error) {
      attempt += 1;

      if (!isNonceError(error) || attempt >= retries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
}

export async function createOnChainStock(
  contract: Contract,
  symbol: string,
  name: string,
  pricePaise: bigint,
): Promise<number> {
  await sendAndConfirm(contract, () =>
    contract.createStock(symbol, name, pricePaise),
  );

  const index = await scanOnChainStocks(contract);
  const snapshot = index.get(normalizeOnChainSymbol(symbol));

  if (!snapshot) {
    throw new Error(`Stock ${symbol} was not found after creation.`);
  }

  return snapshot.stockId;
}

export async function ensureOnChainStockMapping(
  contract: Contract,
  index: Map<string, OnChainStockSnapshot>,
  stock: DatabaseStockForSetup,
): Promise<SetupMappingRow> {
  const normalizedSymbol = normalizeOnChainSymbol(stock.symbol);
  const pricePaise = inrToPaise(Number(stock.currentPrice.toString()));
  let snapshot = index.get(normalizedSymbol);
  let action: SetupMappingRow["action"] = "mapped";

  if (!snapshot) {
    const stockId = await createOnChainStock(
      contract,
      stock.symbol,
      stock.companyName,
      pricePaise,
    );

    snapshot = {
      stockId,
      symbol: stock.symbol,
      name: stock.companyName,
      pricePaise,
      active: true,
    };

    index.set(normalizedSymbol, snapshot);
    action = "created";
  } else if (!verifySymbolMatch(stock.symbol, snapshot.symbol)) {
    throw new Error(
      `Symbol mismatch for ${stock.exchange}:${stock.symbol} — on-chain symbol is ${snapshot.symbol}.`,
    );
  }

  if (!snapshot.active && stock.isActive) {
    await sendAndConfirm(contract, () =>
      contract.setStockActive(snapshot!.stockId, true),
    );
    snapshot.active = true;
  }

  if (snapshot.pricePaise !== pricePaise) {
    await sendAndConfirm(contract, () =>
      contract.updateStockPrice(snapshot!.stockId, pricePaise),
    );
    snapshot.pricePaise = pricePaise;
    action = action === "created" ? "created" : "price-updated";
  }

  const idIndex = buildOnChainIdIndex(index);
  const resolution = resolveCanonicalOnChainStockId(stock, index, idIndex);

  if (resolution.kind === "error") {
    throw new Error(resolution.message);
  }

  if (resolution.needsRemap) {
    action = "remapped";
  }

  return {
    symbol: stock.symbol,
    exchange: stock.exchange,
    dbId: stock.id,
    onChainStockId: resolution.onChainStockId,
    action,
    detail: resolution.detail,
  };
}

export async function deactivateOnChainStock(
  contract: Contract,
  index: Map<string, OnChainStockSnapshot>,
  symbol: string,
): Promise<SetupMappingRow | null> {
  const snapshot = index.get(normalizeOnChainSymbol(symbol));

  if (!snapshot || !snapshot.active) {
    return null;
  }

  await sendAndConfirm(contract, () =>
    contract.setStockActive(snapshot.stockId, false),
  );
  snapshot.active = false;

  return {
    symbol: snapshot.symbol,
    exchange: "—",
    dbId: "—",
    onChainStockId: snapshot.stockId,
    action: "deactivated",
    detail: "Inactive database stock deactivated on-chain.",
  };
}

export function formatSetupTable(rows: SetupMappingRow[]): string {
  const header = "Symbol".padEnd(12) +
    "Exchange".padEnd(10) +
    "DB ID".padEnd(10) +
    "On-chain ID".padEnd(12) +
    "Action";

  const lines = rows.map((row) =>
    row.symbol.padEnd(12) +
    row.exchange.padEnd(10) +
    row.dbId.slice(0, 8).padEnd(10) +
    String(row.onChainStockId).padEnd(12) +
    row.action +
    (row.detail ? ` (${row.detail})` : ""),
  );

  return [header, ...lines].join("\n");
}

export function formatVerifyTable(rows: VerifyMappingRow[]): string {
  const header = "Symbol".padEnd(12) +
    "Exchange".padEnd(10) +
    "On-chain ID".padEnd(12) +
    "Status".padEnd(8) +
    "Detail";

  const lines = rows.map((row) =>
    row.symbol.padEnd(12) +
    row.exchange.padEnd(10) +
    String(row.onChainStockId ?? "—").padEnd(12) +
    row.status.padEnd(8) +
    row.detail,
  );

  return [header, ...lines].join("\n");
}

export function buildVerifyRows(
  stocks: DatabaseStockForSetup[],
  index: Map<string, OnChainStockSnapshot>,
): VerifyResult {
  const rows: VerifyMappingRow[] = [];
  const idIndex = buildOnChainIdIndex(index);

  for (const stock of stocks) {
    if (!stock.isActive || !stock.simulationEnabled) {
      continue;
    }

    const identity = stockIdentityKey(stock.exchange, stock.symbol);
    const snapshotBySymbol = index.get(normalizeOnChainSymbol(stock.symbol));

    if (stock.onChainStockId === null) {
      rows.push({
        symbol: stock.symbol,
        exchange: stock.exchange,
        dbId: stock.id,
        onChainStockId: null,
        status: "FAIL",
        detail: `Missing onChainStockId in PostgreSQL for ${identity}.`,
      });
      continue;
    }

    if (!snapshotBySymbol) {
      rows.push({
        symbol: stock.symbol,
        exchange: stock.exchange,
        dbId: stock.id,
        onChainStockId: stock.onChainStockId,
        status: "FAIL",
        detail: `On-chain instrument not found for ${identity}.`,
      });
      continue;
    }

    const snapshotAtStoredId = idIndex.get(stock.onChainStockId);

    if (
      snapshotAtStoredId &&
      !verifySymbolMatch(snapshotAtStoredId.symbol, stock.symbol)
    ) {
      rows.push({
        symbol: stock.symbol,
        exchange: stock.exchange,
        dbId: stock.id,
        onChainStockId: stock.onChainStockId,
        status: "FAIL",
        detail: `Stored onChainStockId ${stock.onChainStockId} points to ${snapshotAtStoredId.symbol}, expected ${stock.symbol} for ${identity}. Run npm run trading:setup-on-chain.`,
      });
      continue;
    }

    if (stock.onChainStockId !== snapshotBySymbol.stockId) {
      rows.push({
        symbol: stock.symbol,
        exchange: stock.exchange,
        dbId: stock.id,
        onChainStockId: stock.onChainStockId,
        status: "FAIL",
        detail: `${identity} is on-chain at ID ${snapshotBySymbol.stockId}, but PostgreSQL stores ${stock.onChainStockId}. Run npm run trading:setup-on-chain.`,
      });
      continue;
    }

    if (!verifySymbolMatch(stock.symbol, snapshotBySymbol.symbol)) {
      rows.push({
        symbol: stock.symbol,
        exchange: stock.exchange,
        dbId: stock.id,
        onChainStockId: stock.onChainStockId,
        status: "FAIL",
        detail: `Symbol mismatch for ${identity}: database ${stock.symbol}, on-chain ${snapshotBySymbol.symbol}.`,
      });
      continue;
    }

    const snapshot = snapshotBySymbol;

    if (snapshot.pricePaise <= BigInt(0)) {
      rows.push({
        symbol: stock.symbol,
        exchange: stock.exchange,
        dbId: stock.id,
        onChainStockId: stock.onChainStockId,
        status: "FAIL",
        detail: "On-chain price must be greater than zero.",
      });
      continue;
    }

    if (!snapshot.active) {
      rows.push({
        symbol: stock.symbol,
        exchange: stock.exchange,
        dbId: stock.id,
        onChainStockId: stock.onChainStockId,
        status: "FAIL",
        detail: "On-chain stock is inactive.",
      });
      continue;
    }

    rows.push({
      symbol: stock.symbol,
      exchange: stock.exchange,
      dbId: stock.id,
      onChainStockId: stock.onChainStockId,
      status: "PASS",
      detail: `Price ${paiseToInrString(snapshot.pricePaise)} INR`,
    });
  }

  const passed = rows.filter((row) => row.status === "PASS").length;
  const failed = rows.filter((row) => row.status === "FAIL").length;

  return { rows, passed, failed };
}
