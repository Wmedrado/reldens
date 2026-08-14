# Reldens Economy Service

Minimal reference implementation of the external soft-currency economy service
that the Reldens game server proxies to. It is a **separate deployable
process** with zero dependencies (node http only) and a file-backed append-only
JSON ledger.

This is a v1 reference: it is intentionally simple, deterministic and
single-process. The peg is fixed (1 claudium = 0.01 usd), Stripe intents are
simulated with fake client secrets, there is no on-chain settlement, and all
state lives in one `data/ledger.json` file guarded by an in-memory idempotency
map.

## Run

```bash
cd services/economy-service
npm install        # no-op, zero deps
npm start          # or: node server.js
npm test           # store self-test, no HTTP needed
```

Or run from the repo root:

```bash
node services/economy-service/server.js
node services/economy-service/test.js
```

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8301` | HTTP port to listen on. |
| `ECONOMY_INTERNAL_SECRET` | (none) | Required. Every request must send this in the `x-reldens-economy-secret` header; anything else gets `403`. Without it all requests are rejected. |
| `STRIPE_PUBLISHABLE_KEY` | (none) | When set, `POST /purchase` on the `stripe` rail returns a simulated PaymentIntent (fake client secret) with `ok: true`. When unset, `stripe` purchases return `ok: false, reason: "rail_unavailable"`. |
| `WOC_ORACLE` | (none) | When set, `GET /price/:rail` returns `wocBaseUnitsPerClaudium` (placeholder oracle value `1`); otherwise it is `null`. |

## Endpoints

```
GET  /balance/:accountId            -> {balance}
GET  /price/:rail                   -> {rail, usdPerClaudium, wocBaseUnitsPerClaudium}
GET  /skus                          -> [{sku, usd, claudium}]
GET  /store/:accountId              -> [{itemId, name, kind, costClaudium, owned}]
GET  /history/:accountId            -> [{entryId, accountId, delta, reason, ref, atMs}]
POST /purchase                      -> {ok, purchaseId, rail, claudium, stripe, woc, reason}
POST /spend                         -> {granted, balance, costClaudium, reason}
GET  /health                        -> {ok, pid}
```

`POST /purchase` body: `{accountId, rail, sku, idempotencyKey}`.
`POST /spend` body: `{accountId, itemId, kind, expectedCostClaudium, idempotencyKey}`.

Request bodies are capped at 1 MB. JSON bodies only.

## How the game proxy connects

The Reldens game server never talks to this service directly from the browser.
`lib/blockchain/server/economy-proxy.js` is the server-side client:

| Game env var | Must equal service env var |
| --- | --- |
| `RELDENS_ECONOMY_SERVICE_URL` | base URL of this service (e.g. `http://localhost:8301`) |
| `RELDENS_ECONOMY_INTERNAL_SECRET` | `ECONOMY_INTERNAL_SECRET` |

The proxy sends the secret in the `x-reldens-economy-secret` header. If either
game env var is unset, or the service is down, the proxy degrades to typed
"unavailable" results and the game keeps running.

Example pairing:

```bash
# economy service process
ECONOMY_INTERNAL_SECRET=change-me STRIPE_PUBLISHABLE_KEY=pk_test_x node services/economy-service/server.js

# game server .env
RELDENS_ECONOMY_SERVICE_URL=http://localhost:8301
RELDENS_ECONOMY_INTERNAL_SECRET=change-me
```

## v1 caveats

- **No real Stripe.** Purchase intents are fabricated in-process; nothing is
  charged and nothing is settled. Wire a real Stripe SDK (or any PSP) into
  `POST /purchase` to make purchases real.
- **No on-chain settlement.** No WOC/SOL/USDC/token rails are actually
  processed; only `stripe` (with `STRIPE_PUBLISHABLE_KEY` set) returns a
  successful intent, and even that never touches a ledger balance.
- **Single-process only.** The ledger is an in-memory Map flushed to one JSON
  file. Two instances pointed at the same file will corrupt each other. Scale
  out later with a real datastore and atomic idempotency.
- **Peg is fixed.** `usdPerClaudium` is hardcoded to `0.01`. Replace it with an
  oracle feed when you have one.
