# TradeForge Security Guide

This document describes how TradeForge handles security in its **local academic simulation** context. It is not a production security certification.

---

## 1. Authentication

- **Auth.js v5** with Credentials provider and **JWT sessions**
- Passwords hashed with **Argon2id** (`lib/auth/password.ts`)
- Plaintext passwords are never stored or logged
- Invalid login returns a **generic** error message
- Session payload: user `id`, `username`, `email` — no wallet secrets
- Protected pages enforced via `auth.config.ts`, `middleware.ts`, and `(main)/layout` `requireAuth()`

## 2. Authorization

- Every user-owned API calls `getCurrentUser()` or `requireAuth()` first
- Database operations use **`userId` from the authenticated session**
- Never trust `userId`, wallet address, or resource ownership from client request body/query
- Cross-user access returns **404** (resource not found / not owned) or **401** (unauthenticated)

## 3. Wallet Security

The **TradeForge Wallet** is custom — not MetaMask.

| Data | Storage |
| --- | --- |
| Encrypted keystore JSON | Browser `localStorage` (client only) |
| Wallet password | Memory during unlock only |
| Private key / mnemonic | Memory during unlock / creation only |
| Wallet address | PostgreSQL metadata (server) |

- Backend **never** receives private keys or mnemonics
- Trading requires: authenticated user + registered DB address + **matching unlocked wallet address**
- `assertWalletAddressMatch()` blocks signing on mismatch

## 4. Secret Management

| Secret | Usage |
| --- | --- |
| `AUTH_SECRET` | Server-only — JWT signing |
| `DATABASE_URL` | Server-only — Prisma |
| `BLOCKCHAIN_RPC_URL` | Server read-only; `NEXT_PUBLIC_*` for browser RPC |
| Anvil dev keys | **Scripts only** — never for real funds |

- Copy `.env.example` → `.env`; never commit `.env`
- `.env.example` uses placeholders only

## 5. Blockchain Security

- **Chain ID 31337** (local Anvil) — validated before client signing
- Server uses **read-only** JSON-RPC provider — no server-side transaction signing
- Contract addresses from checked-in deployment artifacts (`addresses.local.json`)
- Transaction hashes verified read-only for history UI (`lib/blockchain/server-transaction.ts`)

## 6. Smart Contract Access Control

- `Stock.sol` / `User.sol`: **Ownable** admin for stock creation, price updates, virtual cash credits
- Trades require registered user, active stock, sufficient cash/holdings
- Holdings and virtual cash are **per-address** on-chain

## 7. Database Isolation

- Prisma ORM with parameterized queries
- Orders, trades, transactions, holdings, watchlists scoped by `userId`
- Unique constraints on `txHash` for idempotent sync
- Raw SQL not used for user-controlled input

## 8. Input Validation

Server-side **Zod** validation for:

- Order creation (symbol, side, quantity, price paise, on-chain stock id)
- Sync payloads (`txHash` format)
- Transaction list pagination and filters
- Market search parameters
- Wallet registration (Ethereum address format)
- Resource IDs (UUID) on `[id]` API routes

Financial math uses **BigInt** share units (`10^8` scale) and **paise** for INR — not JavaScript `float` for money.

## 9. Error Handling

**Clients receive:**

- Short, safe messages (`"Unauthorized."`, `"Unable to load portfolio."`, etc.)
- Mapped blockchain failures (`"Blockchain is unavailable."`, insufficient cash/holdings messages)

**Clients do not receive:**

- Stack traces, Prisma errors, SQL, file paths, env vars, or RPC internals

Server diagnostics: `logServerError(context, error)` logs `error.name` and `error.message` only.

## 10. Anvil Limitations

- Restarting or resetting Anvil may remove on-chain transaction history
- PostgreSQL records are **preserved** as historical projections
- UI labels stale records: **"Historical record"** — status is **not** auto-marked FAILED
- Portfolio and history pages remain usable when chain state diverges

## 11. Development-Only Assumptions

- Localhost PostgreSQL with default credentials in examples
- Anvil ships with **well-known development private keys**
- No TLS requirement for local HTTP
- No rate limiting (see below)
- Simulated market prices — not real exchange data
- No real money, banks, or brokerage integration

## 12. Production Considerations

If TradeForge were ever deployed beyond a classroom demo:

| Area | Recommendation |
| --- | --- |
| Rate limiting | Login, register, order create, sync, wallet registration |
| CSRF | Explicit tokens if cross-origin cookies are used |
| CSP | Strict policy with nonce-based scripts |
| Secrets | Vault / managed secrets; rotate `AUTH_SECRET` |
| Blockchain | Never reuse Anvil keys; use audited deployment pipeline |
| Wallet | Consider hardware wallet or HSM for any real-value scenario |
| Monitoring | Structured logging without PII/secrets |
| Dependencies | Regular `npm audit` with controlled upgrades |

**Rate limiting is not implemented** because TradeForge is a local academic simulation and does not expose production internet-facing infrastructure.

Endpoints that would need rate limiting in production:

- `POST /api/auth/*` (login/register server actions)
- `POST /api/trading/orders`
- `POST /api/trading/orders/[id]/sync`
- `POST` wallet registration server actions
- `GET /api/market/*` (abuse prevention)

---

See also: [security-audit.md](./security-audit.md) for the Phase 14 findings register.
