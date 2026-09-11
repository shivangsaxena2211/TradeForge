# DEFINN Database Schema

PostgreSQL stores **application and projection data**. Blockchain state (virtual cash, on-chain holdings, executed trades) is authoritative on `Stock.sol` after confirmation.

## Data classification

| Category | Storage | Examples |
| --- | --- | --- |
| Application / query | PostgreSQL | Users, stocks metadata, watchlists, simulated prices |
| Blockchain authoritative | Anvil / `Stock.sol` | Virtual cash, holdings, trade execution |
| Historical projection | PostgreSQL after sync | Orders, trades, transactions, holdings snapshot |

## Core models

### User

Application account (Auth.js credentials).

- Email, username, Argon2id password hash
- **No** private keys or wallet secrets

### Wallet

Registered DEFINN wallet metadata per user.

- Ethereum address, wallet type, timestamps
- **Address only** — signing material stays client-side

### VirtualAccount

Legacy/demo balance model. **Not used** for on-chain trading cash in Phases 10+.

### Stock

Curated Indian equity catalogue (Phase 16).

- `symbol`, `companyName`, `exchange` (unique together)
- `isin`, `sector`, `instrumentType`
- OHLCV session fields: `dayOpen`, `dayHigh`, `dayLow`, `volume`
- `currentPrice`, `previousClose` (Decimal)
- `priceSource` (`HISTORICAL_IMPORT` | `SIMULATION`)
- `marketStatus`, `simulationEnabled`, `lastMarketUpdateAt`
- `onChainStockId` — links to `Stock.sol` for execution
- Legacy DEMO1/DEMO2/DEMO3 remain as **inactive** rows

### PriceHistory

OHLCV time series for charts.

- `sourceType`: `HISTORICAL` (CSV import) or `SIMULATED` (engine)
- `open`, `high`, `low`, `close`, `volume`, `timestamp`
- Unique per `(stockId, timestamp, sourceType)`

### MarketSimulationState

Singleton persistence for simulation engine snapshots (regime, seed, clock).

### Watchlist

User-scoped saved symbols (`userId` + `stockId`).

### Order

Trade intent and lifecycle.

- `PENDING` → `EXECUTED` / `FAILED` / `CANCELLED`
- Scoped by `userId`
- Links to stock, quantity, side, execution price when synced

### Holding

PostgreSQL projection of user positions.

- Quantity, average buy price (from confirmed blockchain trades)
- Valuation uses **simulated** PostgreSQL `Stock.currentPrice`

### Trade

Confirmed execution record from sync.

- Execution price, quantity, total value, timestamp
- Tied to order and user

### Transaction

Blockchain transaction projection (explorer UI).

- `txHash`, block number, status, type (`STOCK_BUY` / `STOCK_SELL`)
- Unique `txHash` for idempotent sync
- Read-only on-chain verification when Anvil is available

## User isolation

All user-owned tables filter by **`userId` from the authenticated session**, never from client-supplied IDs.

## Anvil reset behavior

If Anvil is restarted or reset:

- PostgreSQL historical records **remain**
- UI may show **Historical record** when tx is missing on current chain
- Records are **not** auto-deleted or marked `FAILED`

## Credentials

`DATABASE_URL` is server-only. Never commit `.env` or expose connection strings in the UI.
