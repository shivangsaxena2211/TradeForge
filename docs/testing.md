# DEFINN Testing Strategy

**Current baseline:** 125 Vitest · 35 Foundry · typecheck · lint · build PASS (after Phase 15 UI polish).

Academic simulation project. Tests focus on regression resistance and security, not arbitrary coverage percentages.

## Test layers

| Layer | Location | Purpose |
| --- | --- | --- |
| Unit | `test/*.test.ts` | Pure logic, validation schemas, calculations |
| Integration | `test/integration/*.test.ts` | PostgreSQL + Anvil when available |
| Smart contracts | `test/*.t.sol` | Foundry tests for `User.sol` / `Stock.sol` |
| Live trading | `test/trading-live.test.ts` | End-to-end BUY/SELL + sync |

## Key areas

### Authentication
- Registration/login Zod schemas
- Email normalization
- Password hashing (Argon2id)
- Generic validation messages (no account enumeration)

### Security / isolation
- Wallet address mismatch protection
- User-scoped service queries (`userId` in `where`)
- Integration tests: User A cannot read User B order/transaction by ID
- Secret exposure guardrails in API payload shapes

### Trading
- Share/paise precision
- UX validation (insufficient cash/holdings, inactive stock)
- Order lifecycle states
- Idempotent `syncOrderFromTransaction(txHash)`

### Portfolio
- Cost basis, weighted average, unrealized P/L
- Partial/full sell quantity behavior

### Blockchain
- Read-only `verifyTransactionOnChain()`
- Historical record handling after Anvil reset
- Provider unavailable paths

### Market
- Simulated price bounds
- Symbol/search validation
- Watchlist schema validation

## Running tests

```bash
npm test
npm run typecheck
npm run lint
npm run build
forge test -vvv
```

## Integration prerequisites

Integration tests skip automatically when:

- `DATABASE_URL` is missing
- Anvil is not running

This is expected in CI environments without services.

## Known environmental issues

- Wallet encryption tests may be slow on some machines; timeout increased to 15s for Argon2 operations.

## Failure scenarios covered

| Scenario | Expected behavior |
| --- | --- |
| Anvil offline | PostgreSQL history still queryable; verification unavailable |
| Anvil reset | Historical PostgreSQL tx remains; not marked FAILED |
| Duplicate sync | Single `Transaction` per `txHash` |
| Blockchain success + DB sync failure | `blockchainSucceeded: true`; retry possible |
| Wrong user resource ID | `null` / HTTP 404; no data leak |

## Gaps (intentional)

- Full HTTP route handler tests with mocked Auth.js sessions
- Playwright browser E2E
- Realized P/L and portfolio performance charts
- Automated reconciliation jobs
