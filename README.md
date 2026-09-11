# DEFINN

**Blockchain-Based Decentralized Stock Trading Simulation Platform**

## Project Description

DEFINN is an academic prototype inspired by the IEEE research paper *"Blockchain-Enabled Fintech Innovation: A Case of Reengineering Stock Trading Services."* It demonstrates how blockchain technology and smart contracts can support a transparent, automated stock-trading workflow in a controlled simulation environment.

> **Important:** DEFINN is a **simulation/academic prototype**. It does **not** handle real money, connect to bank accounts, execute real NSE/BSE or other exchange trades, process real payments, provide real brokerage services, trade real cryptocurrency, or operate as a production stock exchange. Users trade with **virtual investment funds** and **simulated/demo market data**.

## Project Purpose

- Demonstrate a hybrid architecture combining PostgreSQL and an Ethereum-compatible local blockchain
- Explore smart-contract-driven trading workflows in an academic setting
- Provide a foundation for incremental development of authentication, wallet, market, and trading modules

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui, Recharts (planned) |
| Backend/API | Next.js App Router (server/API routes) |
| Database | PostgreSQL, Prisma ORM |
| Blockchain | Anvil / Foundry (local Ethereum-compatible chain) |
| Smart Contracts | Solidity, Foundry |
| Blockchain Client | ethers.js v6 (read-only provider; contract writes in Phase 8) |
| Wallet | Custom DEFINN Wallet (**no MetaMask**) |
| Testing | Foundry, Vitest, Playwright (later if required) |

## Planned Architecture

DEFINN uses a **hybrid architecture** that keeps concerns separated:

```
Frontend (Next.js + shadcn/ui)
        ↓
Backend/API (Next.js server routes)
        ↓
┌───────────────────┬──────────────────────┐
│   PostgreSQL      │  Local Blockchain    │
│   (Prisma ORM)    │  (Anvil + Solidity)  │
│                   │                      │
│ • Users           │ • Trading state      │
│ • Stock metadata  │ • Transaction records│
│ • Orders/indexes  │                      │
│ • Watchlists      │                      │
│ • Market cache    │                      │
└───────────────────┴──────────────────────┘
        ↓
Custom DEFINN Wallet (local signing via ethers.js)
```

**PostgreSQL** stores application-level relational data. **Blockchain** will eventually hold important trading state and transaction records. Not all application data is stored on-chain.

## Development Prerequisites

- **Node.js** 20+ (22+ recommended for latest Prisma tooling)
- **npm** 10+
- **PostgreSQL** 14+ (local or hosted)
- **Foundry** (optional for this phase; required for smart-contract development)
  - Install: [https://getfoundry.sh](https://getfoundry.sh)
  - Provides `forge`, `cast`, and `anvil`

## Initial Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd definn
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `DATABASE_URL` to your PostgreSQL instance.

4. **Generate Prisma client**

   ```bash
   npm run db:generate
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret for Auth.js JWT/session signing (`openssl rand -base64 32`) |
| `BLOCKCHAIN_RPC_URL` | Local Anvil RPC URL (default: `http://127.0.0.1:8545`) |
| `CHAIN_ID` | Chain ID for the local network (default: `31337` for Anvil) |

Never commit secrets, private keys, or production credentials to the repository.

## Authentication

Phase 4 adds **application-level authentication** using [Auth.js](https://authjs.dev/) (`next-auth` v5) with a **Credentials** provider. This is separate from the future DEFINN blockchain wallet (Phase 5).

### Approach

| Concern | Implementation |
| --- | --- |
| Registration / login | Server Actions (`loginAction`, `registerAction`) |
| Password hashing | Argon2id via `@node-rs/argon2` |
| Sessions | Auth.js JWT sessions in secure HTTP-only cookies |
| Route protection | Auth.js `authorized` callback + `middleware.ts` |
| Server helpers | `getCurrentUser()`, `requireAuth()` in `lib/auth/session.ts` |

### Authentication vs wallet

- **Application auth:** email + password → PostgreSQL `User` → session
- **Blockchain wallet:** DEFINN wallet → public address → transaction signing (Phase 5)

Users can sign in without a wallet. Registration does **not** create wallets, virtual accounts, or blockchain keys.

### Protected routes

Require authentication: `/dashboard`, `/markets`, `/portfolio`, `/orders`, `/wallet`, `/settings`

Public routes: `/`, `/login`, `/register`

### Local auth setup

```bash
cp .env.example .env
# Set DATABASE_URL and AUTH_SECRET (openssl rand -base64 32)
npm run db:migrate
npm run dev
```

Visit `/register` to create an account, then `/login` to sign in.

Blockchain wallet functionality is **not** part of Phase 4.

## DEFINN Wallet (Phase 5)

The **DEFINN Custom Wallet** is the project's own wallet UI and key-management layer for the academic simulation. It replaces MetaMask with application-level wallet functionality built on **ethers.js v6** cryptographic primitives.

### What it is

- Ethereum-compatible wallet creation and import (recovery phrase or private key)
- Browser-side encryption using ethers.js JSON keystore (`wallet.encrypt`)
- Encrypted keystore stored in **browser localStorage** (per user)
- Public wallet metadata stored in PostgreSQL (`address`, `walletType`, timestamps)

### What is NOT stored in PostgreSQL

- Private keys
- Recovery phrases / mnemonics
- Seed phrases
- Wallet passwords
- Encrypted keystore JSON

### Security model

| Layer | Stored data |
| --- | --- |
| PostgreSQL `Wallet` | `userId`, `address`, `walletType`, timestamps |
| Browser localStorage | Encrypted ethers.js keystore JSON only |
| Memory (when unlocked) | Decrypted wallet until user locks |

Wallet passwords are separate from application login passwords. Losing the recovery phrase and wallet password means losing access — DEFINN cannot recover the wallet.

### Not yet implemented (later phases)

- Anvil / blockchain RPC connectivity
- Real on-chain balance display
- Transaction signing and broadcasting
- Smart contract interaction

This is an **academic simulation wallet**, not a production hardware wallet.

### Wallet commands

```bash
npm run test   # wallet unit tests (vitest)
```

## Local Blockchain (Phase 6)

Phase 6 adds **read-only** connectivity between the DEFINN Wallet and a local **Anvil** Ethereum-compatible development blockchain.

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** (for authenticated wallet address lookup)
- **Foundry** (provides `anvil` and `forge`) — [https://getfoundry.sh](https://getfoundry.sh)

### Environment

```bash
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
```

### Startup

Terminal 1 — local blockchain:

```bash
npm run blockchain:start
# or: anvil --host 127.0.0.1 --port 8545 --chain-id 31337
```

Terminal 2 — application:

```bash
npm run dev
```

### Important distinctions

| Concept | Description |
| --- | --- |
| **Anvil** | Local development blockchain with fake test ETH |
| **Anvil dev accounts** | Pre-funded deterministic accounts for development — never use with real funds |
| **DEFINN Wallet** | User-generated wallet with its own address — separate from Anvil accounts |
| **Virtual stock balance** | PostgreSQL `VirtualAccount` — unrelated to on-chain ETH |

Phase 6 is **read-only**: no transactions, no smart contracts, no stock trading on-chain.

Anvil's ETH is fake test currency for academic simulation only.

## Smart Contracts (Phase 7)

Phase 7 implements the Solidity smart-contract layer inspired by the reference paper's `User.sol` / `Stock.sol` architecture.

See [docs/smart-contracts.md](docs/smart-contracts.md) for full contract documentation.

### Architecture

```
User.sol   →  address-only on-chain registration (no PII)
    ↓
Stock.sol  →  simulated stocks, virtual cash, holdings, market buy/sell, trade records
```

| Layer | Role |
| --- | --- |
| **PostgreSQL** | Application/database layer (users, auth, wallet metadata, future indexing) |
| **Blockchain** | Tamper-resistant simulated trading state and auditable trade records |

### Virtual money (simulation only)

`Stock.sol` uses an internal `virtualCash` mapping — **not** ETH, **not** real INR, **not** an ERC-20 token. The administrator can credit registered users for academic testing via `creditVirtualCash`.

### Precision

| Value | Units | Example |
| --- | --- | --- |
| Price / virtual cash | 1 unit = ₹0.01 | ₹150.50 → `15050` |
| Share quantity | 1 share = `10^8` units | 1.25 shares → `125_000_000` |

Trade value uses deterministic floor division: `floor(price × quantity / 10^8)`.

### Prerequisites

- **Foundry** (`forge`, `anvil`, `cast`) — [https://getfoundry.sh](https://getfoundry.sh)

### Commands

```bash
# Terminal 1 — local blockchain
npm run blockchain:start

# Terminal 2 — compile contracts + extract ABIs
npm run blockchain:build

# Terminal 2 — deploy to Anvil (development-only unlocked account)
npm run blockchain:deploy

# Contract unit tests
npm run blockchain:test
```

### Deployed addresses (local Anvil)

After `npm run blockchain:deploy`, addresses are saved to `lib/blockchain/contracts/addresses.local.json`. ABIs are in `lib/blockchain/contracts/abis/`.

> **Anvil is ephemeral.** Restarting Anvil resets all on-chain state. Re-deploy contracts and update addresses. PostgreSQL data is unaffected.

### Phase 7 scope

Implemented: Solidity contracts, Foundry tests, local deployment, TypeScript artifact exports.

Not yet implemented: browser wallet signing, trading UI, PostgreSQL ↔ blockchain sync, limit orders.

## Wallet ↔ Smart Contract Integration (Phase 8)

Phase 8 connects the custom DEFINN Wallet to `User.sol` and `Stock.sol` with **browser-local signing**.

### Security model

```
Browser → ethers.js Wallet → sign locally → broadcast to Anvil RPC
```

Private keys, mnemonics, and wallet passwords **never** reach PostgreSQL, API routes, or Server Actions.

### Client modules

`lib/blockchain/client/` — signer, contract instances, transaction helper, virtual cash/holdings reads.

### Wallet page actions

- Register wallet on blockchain (`User.sol`)
- View on-chain registration status
- Read simulated virtual cash and holdings (`Stock.sol`)
- Transaction hash + confirmation feedback

### Environment (browser)

```bash
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

Phase 8 does **not** include buy/sell UI — that belongs to later phases.

## Simulated Market (Phase 9)

Phase 9 adds PostgreSQL-backed simulated market browsing at `/markets`.

See [docs/market.md](docs/market.md) for architecture details.

**DEFINN market prices are simulated and are not real NSE/BSE market prices.**

| Layer | Role |
| --- | --- |
| PostgreSQL | Catalogue, price history, search, watchlists |
| Stock.sol | On-chain trading state (separate from browse prices in Phase 9) |

```bash
npm run db:migrate   # applies PriceHistory migration
npm run db:seed      # DEMO1–DEMO3 + simulated history
npm run market:simulate  # admin/dev price tick (PostgreSQL only)
```

Phase 9 scope: **discover → inspect → watch** — no buy/sell execution.

## Database Architecture

DEFINN uses **PostgreSQL** as the application database with **Prisma ORM** for type-safe access. This is separate from the future local blockchain layer, which will handle smart-contract execution and on-chain transaction records.

### Hybrid separation

| PostgreSQL (application) | Blockchain (future) |
| --- | --- |
| Users, authentication data | Smart-contract execution |
| Wallet metadata (public address only) | On-chain transaction hashes |
| Virtual investment accounts | Verifiable on-chain state |
| Stock metadata & simulated prices | Contract-emitted events |
| Watchlists, orders, holdings | |
| Trade & transaction indexing | |

**Wallet key material is never stored in PostgreSQL.** The `Wallet` model stores only the public blockchain address and metadata. Private keys, mnemonics, and seed phrases are handled separately in the custom wallet phase.

### Domain entities

| Model | Purpose |
| --- | --- |
| `User` | Application user (email, username, password hash) |
| `Wallet` | DEFINN wallet metadata linked to a user |
| `VirtualAccount` | Simulated virtual cash balance |
| `Stock` | Simulated stock instrument |
| `Watchlist` | User ↔ stock interest tracking |
| `Order` | Buy/sell order requests |
| `Holding` | Current simulated stock ownership |
| `Trade` | Executed trade records |
| `Transaction` | Blockchain/application transaction index |

### Financial data types

All monetary values (`availableCash`, prices, `totalValue`, etc.) use PostgreSQL `Decimal` (`NUMERIC`) via Prisma — **not** floating-point types. Share quantities use `Decimal(18, 8)`.

Calculated values such as portfolio market value or profit/loss are **not** stored; they are derived at query time from holdings and current stock prices.

### Database commands

```bash
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Apply migrations (requires DATABASE_URL)
npm run db:seed       # Seed simulated demo stocks (DEMO1–DEMO3)
npm run db:studio     # Open Prisma Studio
```

## Security Principles

1. Never hardcode secrets
2. Never commit private keys
3. Never send raw wallet private keys to the backend
4. Never store raw private keys in PostgreSQL
5. Never implement cryptographic algorithms from scratch
6. Use established libraries (e.g. ethers.js) for wallet/key functionality
7. The custom DEFINN wallet will support local transaction signing
8. No MetaMask integration

## Foundry / Anvil

Foundry configuration is in `foundry.toml`. Smart contracts live in `contracts/`.

```bash
npm run blockchain:start   # Start Anvil on 127.0.0.1:8545 (chain ID 31337)
npm run blockchain:build   # Compile + extract ABIs
npm run blockchain:deploy  # Deploy User.sol + Stock.sol to Anvil
npm run blockchain:test    # Run Foundry unit tests
```

## Current Implementation Status

### Completed (Foundation Phase)

- [x] Next.js App Router project with TypeScript, Tailwind CSS, ESLint
- [x] shadcn/ui foundation (`components/ui`, theme variables)
- [x] Project directory structure (`app/`, `components/`, `lib/`, `prisma/`, `contracts/`, `docs/`)
- [x] Prisma PostgreSQL configuration
- [x] Database client infrastructure (`lib/db`)
- [x] Blockchain config infrastructure (`lib/blockchain`)
- [x] Foundry configuration (`foundry.toml`)
- [x] Environment variable template (`.env.example`)
- [x] API health endpoint (`/api/health`)
- [x] Route scaffolds: dashboard, markets, portfolio, orders, wallet

### Completed (Database Phase)

- [x] Prisma domain models: User, Wallet, VirtualAccount, Stock, Watchlist, Order, Holding, Trade, Transaction
- [x] Enums for order sides/types/statuses and transaction types/statuses
- [x] Unique constraints, indexes, and relation delete policies
- [x] Decimal/Numeric types for all financial fields
- [x] Seed script for simulated demo stocks (DEMO1–DEMO3)

### Completed (UI Shell Phase)

- [x] Reusable app layout (sidebar, header, main content area)
- [x] Dashboard, Markets, Portfolio, Orders, Wallet, and Settings pages
- [x] Static/demo presentation data (no database or API calls)
- [x] Reusable UI components (StatCard, EmptyState, tables, etc.)
- [x] Responsive sidebar with mobile navigation sheet
- [x] Static login/register UI shells

### Completed (Authentication Phase)

- [x] User registration with server-side validation (Zod)
- [x] Email + password login via Auth.js Credentials provider
- [x] Argon2id password hashing (`@node-rs/argon2`)
- [x] JWT session management with secure cookies
- [x] Protected app routes via middleware + `requireAuth()`
- [x] Logout and authentication-aware header UI
- [x] Centralized auth helpers (`getCurrentUser`, `requireAuth`)

Phase 3 established the frontend UI shell. Phase 4 adds application authentication only — no wallet, trading, or blockchain features.

### Completed (DEFINN Wallet Phase)

- [x] Custom wallet UI at `/wallet` (create, import, unlock, lock)
- [x] ethers.js v6 wallet generation, import, and JSON keystore encryption
- [x] Browser-side encrypted keystore storage (localStorage)
- [x] PostgreSQL wallet metadata registration (address only)
- [x] Recovery phrase one-time display with user confirmation
- [x] Wallet replacement flow with explicit confirmation
- [x] Authentication-aware header wallet status
- [x] Wallet unit tests (Vitest)

### Completed (Local Blockchain Phase)

- [x] Anvil startup script (`npm run blockchain:start`)
- [x] Centralized blockchain config (`lib/blockchain`)
- [x] ethers.js `JsonRpcProvider` read-only abstraction
- [x] Server-side blockchain health check API
- [x] DEFINN wallet native ETH balance query (read-only)
- [x] Wallet page blockchain connectivity UI
- [x] Header wallet online/offline indicator
- [x] Blockchain unit tests (Vitest)

### Completed (Smart Contracts Phase)

- [x] `User.sol` — on-chain address registration (no PII)
- [x] `Stock.sol` — simulated stocks, virtual cash, holdings, market buy/sell, trade records
- [x] OpenZeppelin `Ownable` administrator access control
- [x] Foundry unit tests (`test/User.t.sol`, `test/Stock.t.sol` — 35 tests)
- [x] Deployment script (`script/Deploy.s.sol`)
- [x] TypeScript contract artifacts (`lib/blockchain/contracts/`)
- [x] Local Anvil deployment verified

### Completed (Wallet ↔ Contract Integration Phase)

- [x] Browser-local signer (`lib/blockchain/client/signer.ts`)
- [x] User.sol registration flow with transaction confirmation UI
- [x] Read-only virtual cash and holdings from Stock.sol
- [x] Database vs unlocked wallet address consistency check
- [x] Chain ID validation before signing
- [x] Header registration status indicator
- [x] Client blockchain Vitest tests

### Completed (Simulated Market Phase)

- [x] `PriceHistory` model and migration
- [x] Market service layer (`lib/market/`)
- [x] Simulated price engine + admin CLI (`npm run market:simulate`)
- [x] Market APIs (`/api/market/*`)
- [x] `/markets` search, filter, sort, watchlist
- [x] `/markets/[symbol]` detail page with Recharts history chart
- [x] Dashboard market summary + watchlist snapshot
- [x] Market Vitest tests (45 total across project)

### Completed (Final UI + Documentation Phase)

- [x] Premium dark fintech design system (navy base, blue/cyan accents, subtle glow)
- [x] Redesigned sidebar with wallet mini-card and active route highlights
- [x] Polished dashboard with real portfolio KPIs, hero card, market chart, blockchain activity
- [x] Markets, stock detail, portfolio, orders, transactions, wallet, settings, auth pages
- [x] Recharts dark-theme styling with area fill
- [x] Loading/empty/error state polish
- [x] Architecture, database, and demo documentation
- [x] Final README for project evaluation and demonstration

See [docs/demo.md](docs/demo.md) and [docs/architecture.md](docs/architecture.md).

### Completed (Security + Error Handling Phase)

- [x] Full security inventory (`docs/security-audit.md`)
- [x] Security guide (`docs/security.md`)
- [x] Safe API error logging (`lib/api/safe-error.ts`)
- [x] Blockchain error normalization (contract reverts, RPC failures)
- [x] UUID validation on user-owned `[id]` API routes
- [x] `/transactions` added to auth middleware protected routes
- [x] HTTP security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`)
- [x] `.env.example` placeholder-only secrets
- [x] Security hardening regression tests (`test/security-hardening.test.ts`)

See [docs/security.md](docs/security.md) and [docs/security-audit.md](docs/security-audit.md).

### Completed (Comprehensive Testing Phase)

- [x] Auth validation and password hashing tests
- [x] User isolation integration tests (orders/transactions)
- [x] Trading idempotency integration test
- [x] Blockchain verification unit tests (read-only)
- [x] API validation regression tests
- [x] Expanded precision/portfolio/trading coverage
- [x] Testing documentation (`docs/testing.md`)

### Completed (Transaction History Phase)

- [x] `/transactions` blockchain-explorer-style history page
- [x] Transaction list/detail APIs (`/api/transactions/*`)
- [x] Search by tx hash or stock symbol
- [x] Status/type filters and pagination
- [x] Transaction detail sheet with order link
- [x] Read-only on-chain verification (`lib/blockchain/server-transaction.ts`)
- [x] Anvil reset / historical record handling
- [x] Transaction documentation (`docs/transactions.md`)

### Completed (Portfolio & Orders Phase)

- [x] `/portfolio` with simulated market valuation and on-chain virtual cash
- [x] `/orders` with PostgreSQL order history and status filters
- [x] Cost basis from confirmed blockchain trades; valuation from PostgreSQL market prices
- [x] Unrealized P/L and allocation display
- [x] Dashboard on-chain virtual cash (replaces demo balance)
- [x] Order detail sheet with transaction hash and block number
- [x] Portfolio APIs (`/api/portfolio/*`) and order list API (`GET /api/trading/orders`)
- [x] Portfolio documentation (`docs/portfolio.md`)

See [docs/portfolio.md](docs/portfolio.md) for valuation vs cost-basis rules and Anvil reset behavior.

### Completed (Simulated Trading Phase)

- [x] Market BUY/SELL via `Stock.sol` (`buy()` / `sell()`)
- [x] Client-side DEFINN wallet signing (no server-side keys)
- [x] Trade panel on `/markets/[symbol]` with confirmation flow
- [x] On-chain execution price as authoritative (PostgreSQL price is browse-only)
- [x] Order lifecycle: `PENDING` → receipt → `EXECUTED` / `FAILED` / `CANCELLED`
- [x] PostgreSQL projection sync (`Order`, `Trade`, `Transaction`, `Holding`)
- [x] Idempotent sync by unique `txHash`
- [x] Trading APIs (`/api/trading/*`)
- [x] On-chain setup script (`npm run trading:setup-on-chain`)
- [x] Trading documentation (`docs/trading.md`)

#### Trading architecture

```
/markets/[symbol] → Trade Panel → PENDING Order (PostgreSQL)
      ↓
DEFINN Wallet signs Stock.sol buy()/sell()
      ↓
Anvil RPC → receipt confirmed
      ↓
Sync API parses TradeExecuted event → EXECUTED + Trade + Transaction + Holding
```

**Source of truth:** `Stock.sol` on Anvil for execution, virtual cash, and holdings. PostgreSQL is an application projection after confirmed transactions. `VirtualAccount.availableCash` is not used for on-chain trades.

See [docs/trading.md](docs/trading.md) for lifecycle, idempotency, and Anvil reset limitations.

### Not Yet Implemented

- Limit orders / order matching engine
- Playwright tests

## Market Simulation (Phase 16)

Phase 16 replaces the simplistic DEMO1/DEMO2/DEMO3 random walk with a **curated universe of ~30 real NSE-listed Indian equities** simulated locally by DEFINN.

**Important:** Real listed security identities do **not** mean real exchange execution. DEFINN does not send orders to NSE/BSE and does not use real money.

### Setup

```bash
npm run db:migrate
npm run market:seed-universe
npm run market:import fixtures/market-data-sample.csv
```

### Features

- Real stock metadata (symbol, ISIN, sector, exchange) via seed pipeline
- CSV historical/reference OHLCV import (`HISTORICAL` vs `SIMULATED` price history)
- Stochastic simulation engine (market factor, sector correlation, volatility regimes, momentum, mean reversion)
- Single server-side simulation singleton (not per browser tab)
- On-chain price snapshot sync at trade time only (not every tick)
- Markets UI: sentiment, regime, sector performance, dual-source charts

See [docs/market-simulation.md](docs/market-simulation.md) for the full model and architecture.

## Documentation

| Document | Description |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | System architecture and Mermaid diagrams |
| [docs/database.md](docs/database.md) | Prisma models and data classification |
| [docs/smart-contracts.md](docs/smart-contracts.md) | `User.sol` / `Stock.sol` reference |
| [docs/trading.md](docs/trading.md) | BUY/SELL lifecycle and sync |
| [docs/portfolio.md](docs/portfolio.md) | Valuation vs cost basis |
| [docs/transactions.md](docs/transactions.md) | Transaction explorer |
| [docs/security.md](docs/security.md) | Security guide |
| [docs/security-audit.md](docs/security-audit.md) | Phase 14 audit register |
| [docs/market-simulation.md](docs/market-simulation.md) | Phase 16 stochastic market simulation |
| [docs/testing.md](docs/testing.md) | Test strategy and baseline |
| [docs/demo.md](docs/demo.md) | Step-by-step demonstration guide |

## Demo Flow (summary)

1. `npm run start:local` — PostgreSQL, Anvil, contracts, stock mappings, demo funding
2. `npm run dev` — start the Next.js application (separate terminal)
3. Register / login
4. Create DEFINN Wallet → unlock → register on-chain
5. Browse markets → BUY with wallet signing
6. View portfolio, orders, and transaction explorer
7. Optional: SELL, Anvil stop/start to show graceful degradation

Full steps: [docs/demo.md](docs/demo.md).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed stock universe (delegates to `market:seed-universe`) |
| `npm run market:seed-universe` | Seed ~30 NSE equities + mark DEMO stocks inactive |
| `npm run market:import` | Import historical OHLCV CSV |
| `npm run db:studio` | Open Prisma Studio |
| `npm run blockchain:start` | Start local Anvil blockchain |
| `npm run blockchain:build` | Compile contracts and extract ABIs |
| `npm run blockchain:deploy` | Deploy contracts to local Anvil |
| `npm run blockchain:test` | Run Foundry contract tests |
| `npm run market:simulate` | Update simulated PostgreSQL market prices |
| `npm run trading:setup-on-chain` | Map PostgreSQL stocks to Stock.sol and optionally credit virtual cash |
| `npm run trading:verify-on-chain` | Verify PostgreSQL ↔ Stock.sol mappings for all active stocks |
| `npm run start:local` | Blockchain/infrastructure setup only (Anvil, deploy, stocks, demo funding) |
| `npm run demo:fund` | Fund demo wallet with 0.1 ETH and up to ₹100,000 virtual cash |
| `npm run test` | Run Vitest unit tests |

Transaction history UI: `/transactions`

## License

Academic project — see repository for license details.
