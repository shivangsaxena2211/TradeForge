# DEFINN Demo Guide

Recommended flow for college demonstration, viva, or project evaluation.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ running
- Foundry (Anvil, Forge)
- `.env` configured from `.env.example`

## 1. Start infrastructure

### One-command blockchain setup (recommended)

```bash
# Ensure PostgreSQL is running and .env.local contains ANVIL_ADMIN_PRIVATE_KEY
npm run start:local
```

This checks PostgreSQL, starts (or detects) Anvil, builds contracts, reuses or deploys as needed, maps 30 stocks by `(exchange, symbol)`, verifies 30/30 PASS, funds the demo wallet with 0.1 ETH, and credits ₹100,000 virtual cash when the wallet is already registered. It prints **Blockchain environment ready** and exits — it does **not** start Next.js.

Start the application separately:

```bash
npm run dev
```

After a fresh Anvil restart, blockchain state resets (registrations, virtual cash, holdings). PostgreSQL persists. Re-run `npm run start:local` to redeploy and remap.

If the demo wallet is not yet registered on-chain:

```bash
npm run demo:fund
```

Run `demo:fund` after unlocking the wallet and clicking **Register on Blockchain** in the app.

### Manual startup

```bash
# Terminal 1 — PostgreSQL (ensure service is running)
npm run db:migrate
npm run market:seed-universe
npm run market:import fixtures/market-data-sample.csv

# Terminal 2 — Anvil
npm run blockchain:start

# Terminal 3 — Deploy contracts (first time or after reset)
npm run blockchain:deploy
npm run trading:setup-on-chain
npm run trading:verify-on-chain

# Terminal 4 — Application
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 2. Authentication

1. **Register** a new account (`/register`)
2. **Login** (`/login`)
3. Confirm redirect to **Dashboard**

## 3. DEFINN Wallet

1. Open **Wallet** (`/wallet`)
2. **Create** or **Import** wallet
3. **Unlock** with password
4. **Register on-chain** via `User.sol`
5. Confirm header/sidebar show address and **Connected**

> Never demonstrate or share private keys or mnemonics on screen recordings.

## 4. Markets & trading

1. Open **Markets** (`/markets`)
2. Observe **Simulation Sentiment**, market regime, and sector performance
3. Search real NSE symbols (e.g. `RELIANCE`, `TCS`, `INFY`)
4. Add to **Watchlist**
5. Open stock detail (e.g. `/markets/RELIANCE`)
6. Note **Historical** vs **DEFINN Simulation** chart sections
7. Read the academic disclaimer — no real NSE/BSE execution
8. Note **Simulated Price** vs **Blockchain Execution** panel
6. Execute **BUY** — unlock wallet, confirm signing
7. Copy **transaction hash** from confirmation

## 5. Portfolio & orders

1. **Portfolio** (`/portfolio`) — holdings, virtual cash, unrealized P/L
2. **Orders** (`/orders`) — filter by status, open detail sheet
3. Verify execution price matches on-chain sync

## 6. Transaction explorer

1. **Transactions** (`/transactions`)
2. Search by hash or symbol
3. Open detail drawer — block number, chain ID **31337**, wallet, related order
4. Confirm **DEFINN Local Network** labeling (not Mainnet)

## 7. Sell flow

1. Return to stock detail
2. Execute **SELL** for partial or full quantity
3. Confirm holding updates in portfolio

## 8. Failure demonstration (optional)

1. **Stop Anvil**
2. Show **Blockchain unavailable** in UI
3. Confirm **history** still loads from PostgreSQL
4. **Restart Anvil** and redeploy if needed
5. Explain **historical record** vs current chain state

## 9. Responsive check

- Desktop: full sidebar + dashboard KPIs
- Tablet/mobile: drawer navigation, scrollable tables

## Anvil reset notes

- Resetting Anvil clears on-chain state
- PostgreSQL orders/transactions **persist** as historical projections
- After reset: redeploy contracts, re-register wallet, re-credit virtual cash via setup script
- UI labels stale txs as historical — does not delete records

## What to emphasize

| Feature | Message |
| --- | --- |
| Custom wallet | No MetaMask; client-side signing |
| Smart contracts | `Stock.sol` executes simulated BUY/SELL |
| Hybrid architecture | PostgreSQL projection + blockchain truth |
| Security | User isolation, no server-side keys (Phase 14) |
| Disclaimer | Academic simulation — no real money |

## What NOT to claim

- Real stock exchange connectivity
- Real money or brokerage
- Production-grade security or scalability
- Ethereum Mainnet deployment
