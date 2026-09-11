# DEFINN Architecture

DEFINN is an **academic blockchain stock-trading simulation**. It combines a Next.js application, PostgreSQL, a custom client-side wallet, and Solidity smart contracts on local Anvil (chain ID 31337).

## High-level architecture

```mermaid
flowchart TB
  User[User Browser]
  Next[Next.js App Router]
  PG[(PostgreSQL / Prisma)]
  Wallet[DEFINN Wallet Client]
  Ethers[ethers.js]
  SC[User.sol / Stock.sol]
  Anvil[Anvil Chain 31337]
  Proj[Portfolio / Orders / Transactions]

  User --> Next
  Next --> PG
  Next --> Wallet
  Wallet --> Ethers
  Ethers --> SC
  SC --> Anvil
  Anvil -->|Receipt + Events| Next
  Next -->|Sync Projection| PG
  PG --> Proj
```

| Layer | Technology | Role |
| --- | --- | --- |
| UI | Next.js 16, React 19, Tailwind, shadcn/ui, Recharts | Dashboard, markets, trading, portfolio, explorer |
| API | Next.js routes + Server Actions | Auth, trading sync, portfolio, transactions |
| Database | PostgreSQL 17, Prisma 7 | Users, market cache, orders, holdings, transaction projection |
| Wallet | Custom DEFINN Wallet (ethers.js) | Client-side signing, encrypted keystore |
| Blockchain | Anvil, Solidity 0.8.24, Foundry | Simulated execution truth for trades, cash, holdings |

## Trading flow

```mermaid
sequenceDiagram
  participant UI as Trade Panel
  participant API as Next.js API
  participant PG as PostgreSQL
  participant W as DEFINN Wallet
  participant SC as Stock.sol
  participant A as Anvil

  UI->>API: Create PENDING order
  API->>PG: Insert Order
  UI->>W: Unlock + sign buy/sell
  W->>SC: buy() / sell()
  SC->>A: Transaction
  A-->>W: Receipt
  UI->>API: Sync with txHash
  API->>A: Verify receipt + parse event
  API->>PG: Order EXECUTED, Trade, Transaction, Holding
```

**Source of truth:** `Stock.sol` for execution price, virtual cash, and on-chain holdings. PostgreSQL simulated prices are for **browse/valuation**; on-chain price is synced at trade submit time via the admin oracle.

## Market simulation (Phase 16)

```mermaid
flowchart TB
  CSV[Historical CSV Import]
  Seed[Stock Universe Seed]
  Engine[MarketSimulationEngine singleton]
  Mem[In-memory state]
  PG[(PostgreSQL Stock + PriceHistory)]
  UI[Markets UI]
  Trade[Trade submit]
  Sync[syncOnChainStockPrice]
  SC[Stock.sol]

  Seed --> PG
  CSV --> PG
  Engine --> Mem
  Mem -->|periodic tick| PG
  PG --> UI
  Engine --> UI
  Trade --> Sync
  Sync --> SC
  PG --> Trade
```

- **Historical data:** CSV import only — no NSE/BSE scraping
- **Future prices:** DEFINN stochastic engine (`HISTORICAL` vs `SIMULATED` in `PriceHistory`)
- **Blockchain:** price snapshot updated on trade, not every simulation tick

## Wallet signing flow

```mermaid
flowchart LR
  A[User unlocks wallet] --> B[Address match check]
  B --> C[Chain ID 31337 check]
  C --> D[Sign Stock.sol tx locally]
  D --> E[Broadcast to Anvil]
  E --> F[Return txHash to UI]
```

Private keys and mnemonics **never** leave the browser. The server stores only wallet **address metadata**.

## Transaction lifecycle

```mermaid
stateDiagram-v2
  [*] --> PENDING: Create order API
  PENDING --> EXECUTED: Sync confirmed tx
  PENDING --> FAILED: Sync failure / revert
  PENDING --> CANCELLED: User cancel
  EXECUTED --> [*]
  FAILED --> [*]
  CANCELLED --> [*]
```

Sync is **idempotent** by unique `txHash`. Historical PostgreSQL records are preserved if Anvil is reset (stale-chain safety).

## Security boundaries

- **Authentication:** Auth.js v5, Argon2id, JWT sessions
- **Authorization:** All user-owned APIs scoped by session `userId`
- **Wallet:** Client-side keystore; address match before signing
- **Errors:** Safe client messages (Phase 14 hardening)

See [security.md](./security.md) and [security-audit.md](./security-audit.md).

## Development assumptions

- Local PostgreSQL and Anvil only
- Chain ID **31337**
- Anvil default dev keys — never for real funds
- Not production-ready
