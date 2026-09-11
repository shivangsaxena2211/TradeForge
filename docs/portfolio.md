# DEFINN Portfolio & Orders (Phase 11)

Academic simulation only. No real money, securities, or exchange execution.

## Architecture

```
Authenticated user
      ↓
PostgreSQL projection (Holding, Order, Trade, Transaction)
      +
Stock.sol read (on-chain virtual cash + optional holding comparison)
      ↓
Portfolio / Orders UI
```

## Source of truth

| Data | Authority |
| --- | --- |
| Trade execution & cost basis | Confirmed `Trade` records from blockchain sync |
| On-chain virtual cash | `Stock.sol virtualCash` |
| Current portfolio valuation price | PostgreSQL `Stock.currentPrice` (simulated market price) |
| Order / trade history queries | PostgreSQL |

PostgreSQL `Holding` is a projection of blockchain state after confirmed trades. It is not an independent ledger.

## Valuation vs cost basis

**Current simulated market value**

```
marketValue = quantity × PostgreSQL currentPrice
```

**Remaining cost basis**

```
costBasis = quantity × averageBuyPrice
```

`averageBuyPrice` is maintained from confirmed blockchain execution prices. Additional BUYs use weighted average:

```
(旧qty × 旧avg + boughtQty × executionPrice) / newQty
```

SELLs reduce quantity without changing the average cost of remaining shares.

**Unrealized P/L**

```
unrealizedPnL = marketValue − costBasis
P/L% = (unrealizedPnL / costBasis) × 100   (if costBasis > 0)
```

## On-chain virtual cash

Displayed as **On-chain Virtual Cash** / **Simulated Trading Cash**.

`VirtualAccount.availableCash` is **not** used for the authoritative trading balance.

## Anvil reset limitation

After restarting Anvil, PostgreSQL may still contain historical trades and holdings while the current blockchain state is empty or different. The portfolio service compares on-chain holdings when possible and shows a stale-state warning.

## APIs

| Route | Purpose |
| --- | --- |
| `GET /api/portfolio` | Summary + holdings |
| `GET /api/portfolio/holdings` | Holdings only |
| `GET /api/trading/orders?status=` | Filtered order list |
| `GET /api/trading/orders/[id]` | Order + trade + transaction detail |
