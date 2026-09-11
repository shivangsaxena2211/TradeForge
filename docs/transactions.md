# DEFINN Transaction History (Phase 12)

Academic simulation only. This is a private explorer-style view for the DEFINN local network — not a public blockchain explorer.

## Purpose

Show authenticated users their blockchain-backed simulated stock trade history with:

- transaction hash
- block number
- status
- related order/trade metadata
- optional live read-only verification against Anvil

## Architecture

```
User → /transactions
         ↓
PostgreSQL Transaction + Order + Trade + Stock  (query/history)
         +
Optional read-only Anvil verification via JsonRpcProvider
```

## Responsibilities

| Layer | Responsibility |
| --- | --- |
| Blockchain | tx hash, block number, receipt status, from/to addresses |
| PostgreSQL | user association, order, trade, stock metadata, status projection |

`Stock.sol` remains authoritative for live execution state. PostgreSQL remains the queryable historical projection.

## APIs

| Route | Description |
| --- | --- |
| `GET /api/transactions` | Paginated list with `status`, `type`, `search`, `page`, `pageSize` |
| `GET /api/transactions/[id]` | Detail with optional on-chain verification |

All routes require authentication and are scoped by `userId`.

## Read-only blockchain verification

`lib/blockchain/server-transaction.ts` uses:

- `getTransaction(txHash)`
- `getTransactionReceipt(txHash)`
- `getBlock(blockNumber)`

No signer. No wallet password. No transaction submission.

## Anvil reset behavior

If PostgreSQL contains a transaction but the current Anvil chain does not:

- PostgreSQL record is **not** deleted
- PostgreSQL status is **not** changed to FAILED
- UI shows **Historical record** with a non-blocking warning

## Security

- User isolation on every query (`where: { userId }`)
- Missing records return `404` without revealing other users' data
- Never expose private keys, mnemonics, passwords, or encrypted keystores

## Limitations

- Not Etherscan or a public explorer
- Not real stock-market execution
- Live verification requires local Anvil connectivity
- Pagination defaults to 20 records per page (max 100)
