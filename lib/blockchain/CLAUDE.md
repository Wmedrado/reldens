# lib/blockchain

Blockchain integration for Reldens: server-side wallet verification for account
linking, token balances, and holder tiers. The server is authoritative and
read-only toward the chain - it verifies and reads, never signs or broadcasts.

## Key files

| Path | What |
|---|---|
| `constants.js` | Shared constants: wallet address shape, challenge TTL, tier thresholds, cache TTLs. |
| `server/wallet-verify.js` | Challenge issue/verify: single-use nonce, expiry, `timingSafeEqual` compare. |
| `server/token-balance.js` | Read-only RPC calls for token balances, response-bounded, cached with TTL. |
| `server/holder-tier.js` | Maps a verified balance to a holder tier (config-driven thresholds). |
| `server/plugin.js` | Feature plugin: registers listeners on `reldens.roomLoginOnAuth` and `reldens.beforeSuperInitialGameData`. |
| `schemas/` | Colyseus state schemas for wallet data sent to clients (public fields only). |

## Invariants

- **Server never constructs or broadcasts transactions.** The chain connection
  is read-only: verify signatures, read balances. Anything that signs or sends
  must not live here.
- **Verify before link.** A wallet is only linked after the server verifies the
  signature against a server-issued challenge; the server never trusts a
  client-asserted address or balance.
- **Challenge single-use.** Each challenge is crypto-random, tied to one
  account, expires after the configured TTL, and is consumed (deleted) on
  successful use; a reused or expired challenge fails closed.
- **Secrets server-side only.** All RPC endpoints and keys come from
  `RELDENS_*` env vars and never ship to the client bundle; nothing secret is
  returned to clients or logged.
- **Cache TTLs.** Balance/tier reads are cached with a short TTL and a bound on
  response bytes; never query the chain per tick or per message.
- **Client gets public fields only.** Wallet data in state schemas is limited to
  what gameplay needs (address snippet, tier); no tokens, nonces, or secrets.

## Persistence

- `blockchain_wallets`: linked wallet per account (address, tier, timestamps).
- `blockchain_challenges`: issued challenges (nonce hash, account, expiresAt).
- Both accessed via `dataServer.getEntity()`, never raw SQL. Schema changes go
  through `migrations/` and regenerate entities with
  `reldens generateEntities --override` (never hand-edit `generated-entities/`).

## Module hooks

- `reldens.roomLoginOnAuth`: wallet re-verification / tier refresh on login.
- `reldens.beforeSuperInitialGameData`: attach public wallet/tier data to the
  client's initial game data payload.

## Tests

- `node tests/test-blockchain-wallet-verify.js`
- `node tests/test-blockchain-token-balance.js`
- `node tests/test-blockchain-holder-tier.js`
