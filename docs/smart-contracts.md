# DEFINN Smart Contracts (Phase 7)

Academic simulation only. No real securities, INR, ETH, or bank balances are represented on-chain.

## Architecture

```
User.sol  →  on-chain wallet registration (address only, no PII)
    ↓
Stock.sol →  simulated stocks, virtual cash, holdings, market buy/sell, trade records
```

| Layer | Responsibility |
| --- | --- |
| **PostgreSQL** | Application/database layer — users, auth, wallet metadata, future indexing |
| **Blockchain** | Tamper-resistant simulated trading state and auditable trade records |

## Contracts

### `User.sol`

- Registers `msg.sender` as an on-chain DEFINN user
- Stores only `registered` + `registrationTimestamp`
- Never stores email, password, username, or other PII

### `Stock.sol`

- Admin-managed simulated stock registry
- Internal virtual cash accounting (simulation faucet)
- Holdings and executed trade records
- Market buy/sell at the current simulated price

## Precision model

| Value | Representation | Example |
| --- | --- | --- |
| Virtual cash / price | 1 unit = ₹0.01 (1 paise) | ₹150.50 → `15050` |
| Share quantity | 1 share = `10^8` units | 1.25 shares → `125_000_000` |

**Trade value:** `floor(price × quantity / QUANTITY_SCALE)`

Fractional paise is truncated deterministically (never silently rounded up).

Example: ₹150.50 × 1.25 shares → `18812` paise units (₹188.12).

## Administrator role

`Stock.sol` uses OpenZeppelin `Ownable`. The contract deployer is the development administrator and can:

- Create/update/deactivate simulated stocks
- Credit simulated virtual cash to registered users

This is a **local development-only** role. Do not use Anvil administrator keys with real funds.

## Commands

```bash
# Terminal 1
npm run blockchain:start

# Terminal 2 — build + extract ABIs
npm run blockchain:build

# Terminal 2 — deploy to Anvil (uses unlocked local dev account)
npm run blockchain:deploy

# Contract tests
npm run blockchain:test
```

## Deployment artifacts

After deployment, addresses are written to:

`lib/blockchain/contracts/addresses.local.json`

ABIs are extracted to:

`lib/blockchain/contracts/abis/`

TypeScript exports live in `lib/blockchain/contracts/index.ts`.

## Anvil reset behavior

Anvil is ephemeral by default. When restarted:

- All on-chain state resets
- Contract addresses may change (re-deploy required)
- Holdings, trades, and virtual cash reset

PostgreSQL data is separate and persists independently.

## Phase 7 scope boundary

Implemented:

- Contract compilation, tests, local deployment, artifacts

Not yet implemented (later phases):

- Browser wallet transaction signing
- Trading UI integration
- PostgreSQL ↔ blockchain synchronization
- Limit orders / order matching
