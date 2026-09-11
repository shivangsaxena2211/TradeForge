# DEFINN Simulated Trading (Phase 10)

Academic simulation only. No real money, securities, or exchange execution.

## Architecture

```
/markets/[symbol]
      ↓
Trade Panel (pre-trade UX validation)
      ↓
POST /api/trading/orders  →  PENDING Order (PostgreSQL)
      ↓
DEFINN Wallet signs Stock.sol buy()/sell()
      ↓
Anvil RPC
      ↓
Receipt confirmed
      ↓
POST /api/trading/orders/{id}/sync
      ↓
Parse TradeExecuted event
      ↓
EXECUTED Order + Trade + Transaction + Holding projection
```

## Source of truth

| Data | Authority |
| --- | --- |
| Trade execution | `Stock.sol` on Anvil |
| Virtual cash for trades | On-chain `virtualCash` |
| Order/Trade/Transaction/Holding (PostgreSQL) | Application projection after confirmed tx |
| Market browse prices | PostgreSQL (not execution price) |

## Order lifecycle

1. `PENDING` — order created before signing
2. Transaction submitted — wallet signs locally
3. `EXECUTED` — receipt confirmed + sync succeeded
4. `CANCELLED` — user rejected signing
5. `FAILED` — transaction reverted

## Idempotency

`Transaction.txHash` is unique. Re-syncing the same hash returns the existing record.

## Blockchain reset

Restarting Anvil clears on-chain state. Redeploy contracts, re-register wallets, recreate on-chain stocks, and re-credit virtual cash.

```bash
npm run blockchain:start
npm run blockchain:deploy
npx tsx scripts/setup-on-chain-trading.ts
npx tsx scripts/setup-on-chain-trading.ts <walletAddress> 10000000
```

## PostgreSQL sync failure

If blockchain succeeds but PostgreSQL sync fails, the UI warns the user. The blockchain trade is not reversed. Retry sync with the same `txHash`.

## VirtualAccount

PostgreSQL `VirtualAccount.availableCash` is **not** deducted during on-chain trades. `Stock.sol virtualCash` is authoritative for Phase 10 execution.
