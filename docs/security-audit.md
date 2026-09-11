# DEFINN Phase 14 — Security Audit

**Date:** 2026-09-11  
**Scope:** Phases 1–13 (authentication, wallet, blockchain, market, trading, portfolio, orders, transactions)  
**Environment:** Local academic prototype (Anvil chain ID 31337, PostgreSQL, Next.js)

This document records a structured security and reliability inventory. DEFINN is a **simulation** — findings are assessed in that context. Development-only configuration is not classified as a production vulnerability without context.

---

## Executive Summary

| Severity | Count (pre-fix) | Count (remaining) |
| --- | ---: | ---: |
| CRITICAL | 0 | 0 |
| HIGH | 0 | 0 |
| MEDIUM | 1 | 0 |
| LOW | 1 | 0 |
| INFO | 12 | 12 |

**No CRITICAL or HIGH findings remain after Phase 14 hardening.**

---

## Boundary Inventory

| Boundary | Location | Controls |
| --- | --- | --- |
| Authentication | `auth.ts`, `auth.config.ts`, `middleware.ts`, `lib/auth/*` | Auth.js v5, JWT sessions, Argon2id passwords, `getCurrentUser()` / `requireAuth()` |
| Authorization | API routes + services (`lib/trading`, `lib/portfolio`, `lib/transactions`, `lib/market`) | Server-side `userId` from session; DB queries scoped by `userId` |
| Wallet | `lib/wallet/*`, `components/wallet/*` | Client-side keystore; encrypted JSON persisted locally; signing in browser only |
| Blockchain signing | `lib/blockchain/client/signer.ts`, `components/trading/trade-panel.tsx` | Unlocked DEFINN wallet; chain ID check; address match before sign |
| Database | `lib/db/client.ts`, Prisma services | Parameterized Prisma queries; no raw SQL interpolation of user input |
| API input | `lib/validation/*` | Zod schemas on trading, market, transactions, wallet registration |
| Secrets | `.env` (gitignored), `AUTH_SECRET`, `DATABASE_URL` | Server-only modules; placeholders in `.env.example` |
| Errors | `lib/api/safe-error.ts`, `lib/blockchain/client/errors.ts` | Generic client messages; sanitized server logging |

---

## Findings

### MEDIUM — Fixed

| ID | Finding | Location | Remediation |
| --- | --- | --- | --- |
| SEC-001 | `/transactions` was protected by `(main)/layout` `requireAuth()` but **not** listed in `PROTECTED_ROUTES` / middleware matcher — unauthenticated users could reach the page shell before layout redirect in some edge cases | `auth.config.ts`, `middleware.ts` | Added `/transactions` to protected routes and middleware matcher |

### LOW — Fixed

| ID | Finding | Location | Remediation |
| --- | --- | --- | --- |
| SEC-002 | `.env.example` contained a value resembling a real `AUTH_SECRET` | `.env.example` | Replaced with explicit placeholder `replace-with-generated-secret` |

### INFO — Documented (no code change required)

| ID | Finding | Notes |
| --- | --- | --- |
| SEC-003 | Anvil default account private keys referenced in `scripts/setup-on-chain-trading.ts` | **Development-only.** Never use for real funds. Documented in `docs/security.md`. |
| SEC-004 | No rate limiting on API routes | Acceptable for local academic prototype. Production endpoints listed in `docs/security.md`. |
| SEC-005 | No restrictive Content-Security-Policy | CSP omitted to avoid breaking Next.js dev, wallet UI, and local scripts. Basic headers added in `next.config.ts`. |
| SEC-006 | CSRF | State-changing routes use session cookies via Auth.js. Same-origin browser requests in local dev. No separate CSRF token framework — documented as adequate for this prototype. |
| SEC-007 | `npm audit` reports 4 high severity issues | Transitive dev dependencies (`@prisma/config` → `deepmerge-ts`, `prisma` → `mysql2`). Fix requires `npm audit fix --force` (breaking). Documented; not applied. |
| SEC-008 | Market summary API is public (no auth) | Intentional — simulated public market browse data only; no user-specific data. |
| SEC-009 | PostgreSQL holds projection, not signing keys | Wallet table stores address/metadata only — verified. |
| SEC-010 | Stale Anvil transactions | Historical PostgreSQL records preserved; UI shows “Historical record” — Phase 11/12 behavior intact. |
| SEC-011 | Server never accepts `privateKey`, `mnemonic`, or raw signed txs via trading APIs | Verified in route handlers and validation schemas. |
| SEC-012 | `VirtualAccount` not used for on-chain cash | On-chain `Stock.sol` virtual cash is authoritative for trades. |
| SEC-013 | Logging uses `error.name` + `error.message` via `logServerError` | Does not log full error objects/stack to console in API paths. |
| SEC-014 | Client bundle | `server-only` on server modules; wallet secrets stay in client memory/localStorage only. |

---

## Secret / Credential Audit

Searched for: `privateKey`, `mnemonic`, `seedPhrase`, `AUTH_SECRET`, `DATABASE_URL`, passwords, API keys, RPC credentials, tokens.

| Check | Result |
| --- | --- |
| Secrets committed to source | **None found** (test fixtures use well-known Anvil addresses only) |
| Secrets returned by APIs | **None** — APIs return addresses, hashes, public metadata |
| Secrets in HTML render | **None** — mnemonic shown only during client-side wallet creation flow (user action) |
| Secrets in PostgreSQL | **None** — password hashes (Argon2id) and wallet addresses only |
| Secrets in logs | **Mitigated** — `logServerError` avoids dumping full stacks; patterns flagged in `isSensitiveErrorMessage` |
| Secrets in client bundle | **None** for server credentials; `NEXT_PUBLIC_*` limited to RPC URL and chain ID |
| `.env` gitignored | **Yes** (`.gitignore`: `.env*`, `!.env.example`) |
| `.env.example` placeholders only | **Yes** after SEC-002 fix |

---

## Wallet Security Review

| Requirement | Status |
| --- | --- |
| Private key stays client-side | ✅ |
| Mnemonic stays client-side | ✅ |
| Encrypted keystore is persisted representation | ✅ |
| Decrypted wallet only in memory (`walletRef`) | ✅ |
| Locking clears signer reference | ✅ `lockWallet()` |
| Wallet password never persisted | ✅ |
| Backend never receives private key / mnemonic | ✅ |
| PostgreSQL stores address/metadata only | ✅ |
| Address match before signing (`assertWalletAddressMatch`) | ✅ |

---

## Authentication Review

| Requirement | Status |
| --- | --- |
| Argon2id password hashing | ✅ `lib/auth/password.ts` |
| Plaintext passwords not stored | ✅ |
| Generic invalid login errors | ✅ |
| Session contains id, username, email only | ✅ |
| Protected routes require auth | ✅ (including `/transactions` after fix) |
| User identity from session, not request body | ✅ |

---

## Authorization / IDOR Review

User-owned APIs verified:

- `GET/POST /api/market/watchlist` — scoped by `user.id`
- `GET/POST /api/trading/orders`, `GET /api/trading/orders/[id]`, sync, cancel — scoped by `user.id`
- `GET /api/portfolio`, `GET /api/portfolio/holdings` — scoped by `user.id`
- `GET /api/transactions`, `GET /api/transactions/[id]` — scoped by `user.id`

Integration coverage: `test/integration/security-isolation.test.ts`

Malformed resource IDs return 404 (not 500) via `uuidParamSchema` on `[id]` routes.

---

## Transaction Authorization

- BUY/SELL signed client-side by unlocked DEFINN wallet
- Server creates `PENDING` orders and syncs after confirmed `txHash`
- Server validates quantity, symbol, side, stock id, price paise via Zod + `shareInputToUnits`
- No API accepts `privateKey`, `mnemonic`, or pre-signed transactions

---

## Input Validation

Zod schemas in `lib/validation/` cover trading, market, transactions, auth, wallet registration. Phase 14 added `lib/validation/common.ts` for UUID, address, and tx hash formats.

Financial precision: `BigInt` / Prisma `Decimal`; share scale `10^8`; price in paise; see `lib/trading/precision.ts`.

---

## Database Security

- User-owned records filtered by `userId` in services
- No user-controlled SQL string interpolation
- Unique `txHash` supports idempotent sync
- Prisma errors not exposed to clients (generic 500 messages)

---

## Blockchain RPC Security

- Server: read-only provider (`lib/blockchain/provider.ts`, `server-transaction.ts`)
- Client: signer from unlocked wallet; chain ID 31337 validated
- Errors normalized via `getSafeBlockchainErrorMessage`

---

## Smart Contract Review

Contracts reviewed: `User.sol`, `Stock.sol`, `IUserRegistry.sol`

| Control | Status |
| --- | --- |
| Ownable admin functions | ✅ |
| Admin-only stock management / virtual cash credit | ✅ |
| Per-user cash and holdings isolation | ✅ |
| `UserNotRegistered`, `StockInactive`, insufficient checks | ✅ |
| Foundry tests | 35 passing |

**No contract changes required.**

---

## Error Handling

- API routes return safe generic messages on 500
- Blockchain reverts mapped to user-readable messages (no VM exception text)
- Database failures do not leak Prisma invocation details

---

## HTTP Security Headers

Added in `next.config.ts`:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`

CSP intentionally omitted (see SEC-005).

---

## Dependency Audit

Run `npm audit` during Phase 14 regression. See final Phase 14 report for counts. Do not run `npm audit fix --force` without maintainer review.

---

## Production Considerations

DEFINN is **not** production-ready. Before any internet-facing deployment: rate limiting, WAF, CSP, HSM/key management, audit logging, secrets rotation, non-default Anvil keys, and professional security review would be required.
