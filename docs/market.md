# DEFINN Simulated Market (Phase 9)

Academic simulation only. **DEFINN market prices are simulated and are not real NSE/BSE market prices.**

## Architecture

| Layer | Role |
| --- | --- |
| **PostgreSQL** | Simulated catalogue, price history, search, watchlists |
| **Stock.sol (Anvil)** | On-chain trading state, virtual cash, holdings, executed trades |

These are intentionally separate in Phase 9. PostgreSQL prices power market browsing; blockchain prices are used when executing on-chain trades in later phases.

## Components

- `lib/market/service.ts` — market data access
- `lib/market/simulation.ts` — deterministic simulated price engine
- `PriceHistory` Prisma model — chart/history storage
- `/api/market/*` — read APIs + authenticated watchlist APIs
- `/markets` — browse, search, filter, watchlist
- `/markets/[symbol]` — stock detail + chart

## Simulated price updates

Development/admin CLI:

```bash
npm run market:simulate
```

This updates PostgreSQL `Stock.currentPrice` and appends a `PriceHistory` record. It does **not** call `Stock.sol.updateStockPrice()` — that remains an admin/on-chain operation for later synchronization work.

## Watchlist

Authenticated users can add/remove stocks via:

- `POST /api/market/watchlist`
- `DELETE /api/market/watchlist/[symbol]`

Watchlist actions do not trigger blockchain transactions.

## Disclaimer

All catalogue companies (DEMO1–DEMO3) are fictional. No real securities, payments, or exchange connectivity are involved.
