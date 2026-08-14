# CloudCraft → Reldens Reuse Mapping

Source: [levy-street/world-of-claudecraft](https://github.com/levy-street/world-of-claudecraft) v0.37.1 (cloned to `C:\Users\willi\AppData\Local\Temp\opencode\world-of-claudecraft-main`)
Target: Reldens v4.0.0-beta.39, 2D pixel NFT browser game (Phaser 3 + Colyseus 0.16 + Node 20, Kenny/Dungeon Crawl assets).

Stack note: CloudCraft = TS ESM strict, Three.js, plain `ws`, Postgres, Svelte admin only. Reldens = JS CommonJS, Phaser, Colyseus, multi-ORM. We port **patterns and logic**, not renderer/server-framework code.

---

## 1. Wallet / Web3 Login — BUILD (highest value, ~80% portable)

| CloudCraft source | What it does | Port decision |
|---|---|---|
| `server/wallet_link.ts` L38-52 | Pure `verifySolanaSignature(msg, sigB58, addrB58)` via `@noble/curves/ed25519`, bs58 len-capped 128, try/catch → false | **Copy verbatim** (TS→JS trivial). No web3.js server-side |
| `server/wallet.ts` L225-275 | Challenge flow: `POST /link/challenge {address}` → `{nonce, message}` (10min TTL, single-use) → verify signature → DB link row. Wallet↔account 1:1 (409) | **Copy pattern**. Adapt: message = `domain + accountId + address + nonce + issuedAt`; Reldens accountId = `player.user_id` |
| `server/ratelimit.ts` + `http/middleware/rate_limit.ts` | Fused ip+account rate-limit policy for auth endpoints | **Copy pattern** (Reldens has no HTTP API layer — wire into login-manager) |
| `src/net/wallet.ts` L760-783 | Client: Wallet Standard discovery, 4 sources (extension / AppKit / mobile deeplink / native), signMessageBase58, silent reconnect, wallet-id in localStorage | **Adapt ~300 lines**. Phaser client same DOM context. AppKit lazy-loaded only when chosen (saves bundle) |
| `src/net/wallet_platform.ts` | Platform gating: web=reown+extension, mobile=deeplinks, PWA=none | Copy as-is, tiny |
| `.env.example` L334-360 | `VITE_REOWN_PROJECT_ID`, `VITE_WALLET_DISABLED`, `SOLANA_RPC_URL`, `WOC_MINT` — server-only keys never `VITE_`-prefixed | Copy env pattern |

**Reldens hook point**: `reldens.roomLoginOnAuth` event (`lib/rooms/server/login.js:94`) — set `result.confirm = false` to deny. New feature module `lib/blockchain/server/plugin.js` listens there + verifies signature. Also `reldens.loginSuccess` (`lib/game/server/login-manager.js:391`) for linking after password/guest login.

**Security rules to port:**
- Server NEVER constructs transactions. Client signs+sends own txs.
- RPC URL/key never ship to client (server proxy endpoint only).
- Nonce single-use, TTL 10min, consumed server-side before verify.
- bs58 decode length cap vs O(n²) DoS. Malformed point → catch → false.

**NOT porting**: Reown AppKit itself unless we want wallet-connect modal UX (optional, big bundle). Wallet Standard discovery alone suffices for Phantom/Solflare browser extensions.

## 2. NFT — BUILD (CloudCraft has read-only verify only)

| CloudCraft source | What it does | Port decision |
|---|---|---|
| `server/seeker_genesis_token.ts` + `seeker_genesis_token_rpc.ts` | Token-2022 read-only entitlement: pinned mint/metadata/group addrs, raw TLV decode (metadata-pointer 18, group-member 23), owner==Tokenz check, batch cap 100 | **Copy verify pattern** for genesis/trait NFTs. Keep constants table |
| `server/seeker_ownership_verifier.ts` | `verify() = claim exists ∧ linked wallet holds mint` — pre-gate for rewards | **Copy pattern** — gate NFT-reward endpoints |

**NOT in CloudCraft (must build ourselves)**: minting, Metaplex metadata, item↔NFT binding, in-game NFT inventory. Reuse point in Reldens: `@reldens/items-system/lib/item/exchange` processor = natural hook for mint/burn on trade/reward. NFT trait→avatar/stat = modifiers conditions (`@reldens/modifiers`) — data entry, no code change.

## 3. Chat & Moderation — EXTEND (Reldens chat exists, moderation missing)

| Area | Reldens has | CloudCraft has | Action |
|---|---|---|---|
| Base chat | `lib/chat` — room-based, DOM UI, message types (MESSAGE/PRIVATE/GLOBAL/TEAMS...), short-key wire format | Sim-local channel router, slash commands | Keep Reldens. Wire format already good |
| Profanity filter | ❌ none | `server/chat_filter.ts` — **two-tier**: soft words (client masks if player opts in), hard words (slurs — server block→warn→timed account mutes). Normalization = `foldConfusables` (NFKD, strip diacritics, leet-fold) → whole-token match. Hard list shipped EMPTY (no slurs in OSS), seeded via `CHAT_FILTER_HARD_LIST`/`_FILE` env | **Copy whole module**. ~pure, host-agnostic. DB parts → adapt to Reldens storage driver |
| Moderation cmds | ❌ none | `server/moderation_commands.ts` (pure parser `/kick /mute /ban /suspend /jail /forcerename`, duration caps) + `moderation_service.ts` behind `ModerationHost` interface | **Copy parser as-is** (pure fn). Wire service into Reldens chat manager + admin |
| Rate limiting | `messages-guard` (global permission check) + `cleaner` (basic scrub) | `server/msg_rate_limit.ts` (pre-parse gate 120/s token bucket, 64KB/s byte budget, verdict BEFORE `JSON.parse`) + `general_chat_quota.ts` (DB-backed per-account LRU 4096) | **Copy pre-parse gate concept** into Colyseus `onMessage` path |
| Ignore/block | ❌ | `/ignore /block` commands + per-account mute tables | Port small |
| Chat persistence | `chat` entity exists | `chat_log.ts` | Already covered |

`obscenity` lib (username validation) — optional, small dep.

## 4. Auth / Account — KEEP RELDENS, cherry-pick 3 things

Reldens has full login/register/guest/forgot + Colyseus sessions. CloudCraft has email/pass + 2FA + OAuth (Discord/GitHub/Apple) + wallet-LINK (not login) + IP blocks + Turnstile.

| Cherry-pick | Source | Why |
|---|---|---|
| scrypt password hash (N=16384) | `server/auth.ts` | Reldens uses pbkdf2-sha512 via `Encryptor` — fine, but scrypt+constant-time compare is better default. Swap if cheap |
| TOTP 2FA | `server/totp.ts` (RFC 6238 pure core) | ~40 lines, pure. Optional later |
| IP block + bot detector seam | `server/ip_block*.ts`, `bot_detector/` | For faucet/NFT-claim abuse protection. High value for crypto game |
| Guest mode | Reldens `guest-{timestamp}` + `emailDomain` config | Keep Reldens. NFT features gate on wallet link, guests can play |

## 5. Economy / Tokens — BUILD (steal proxy pattern)

| CloudCraft source | What | Port |
|---|---|---|
| `server/claudium_proxy.ts` + `claudium.ts` | Soft-currency pass-through to external economy service; server NEVER computes prices; rails `stripe\|sol\|usdc\|woc`; graceful degradation | **Copy proxy pattern** for our token/stablecoin rails |
| `server/woc_balance.ts` | Server-only RPC proxy: `getTokenAccountsByOwner`, 8s timeout, 2min cache TTL, 1024 cap | **Copy as-is** for $TOKEN balance endpoint |
| `src/sim/holder_tier.ts` | 18-rung holder ladder (1 → 1B tokens) → cosmetic badges broadcast as identity payload | **Adapt** — map to pixel-frame/color-tier cosmetics |
| `server/bank_ledger.ts`, `economy_telemetry.ts` | Faucet/sink observability | Copy pattern w/ Prometheus (`prom-client`) |

## 6. Server Hardening — COPY (framework-agnostic, biggest free win)

These are pure/pluggable and Colyseus-agnostic:

1. `msg_rate_limit.ts` — pre-parse flood gate (token bucket + byte budget + abuse window → kick). Colyseus: wrap `onMessage`.
2. `ws_backpressure.ts` — outbound `bufferedAmount` kill. Directly usable in Colyseus room.
3. `chat_filter.ts` — two-tier profanity (see §3).
4. `moderation_commands.ts` — pure moderation parser.
5. `ratelimit.ts` — fused ip+account policies.
6. `linkdead.ts` `planJoin` — resume/reject/join w/ 5-min grace + lease fencing. Reldens has multiserver-disconnect already; compare and pick.
7. Wire protocol discipline: versioned discriminator + typed field checks + serialize-once broadcast (`event_frame.ts`, `realm_readout_memo.ts`). Reldens already has schema-sync (Colyseus) — keep, but adopt **first-frame auth type check** idea.
8. Trust-nothing `dispatchMessage` type-checking — port as Colyseus message schema validation habit.

## 7. AI / Dev-Workflow Rules — COPY NOW (zero game-code cost, high leverage)

| CloudCraft structure | What | Port to |
|---|---|---|
| Root `CLAUDE.md` (341 ln) lean doctrine: HTML comments for zero tokens, anchor on stable paths/symbols NOT counts, point to per-dir docs | Reldens CLAUDE.md is already good; add per-dir pointers + "stable seams" rule | `F:\reldens\CLAUDE.md` |
| Per-dir `CLAUDE.md` (server/, src/sim/, bot/, python/...) | Scoped docs loaded on demand. `server/CLAUDE.md` = best exemplar: module-first doctrine, load-bearing seams table, invariants list | `F:\reldens\lib\blockchain\CLAUDE.md`, `lib\chat\CLAUDE.md`... only where it matters |
| `AGENTS.md` (Codex) + `GEMINI.md` (thin, defers to CLAUDE.md, "CLAUDE.md wins") | Multi-tool parity, one canonical winner | Copy pattern: our `AGENTS.md` stays canonical |
| `.claude/agents/*.md` — 12 read-only specialist reviewers w/ scope gate ("no surface in diff → stop") | QA flow for big changes | Copy 3-4 that matter: hot-path, security/privacy, migration-safety |
| `.claude/hooks/` — layered bar: PreToolUse deny-generated-edit, Stop instant scan (`.only(`, `debugger`, non-determinism in sim), SessionStart githook floor. Fail-open guards | Instant cheap checks every turn → pre-push floor → advisory agents | **Copy verbatim**, adapt paths |
| `.claude/skills/*` — woc-qa, review-pr, feature-plan, extract-and-test, file-issue | Copy 2: feature-plan, review-pr |
| Module-first doctrine: pure decision logic separate from IO shell, injected deps bags, test-first fixes | Apply to `lib/blockchain` module design |

## 8. What NOT to Copy

- Three.js renderer, `src/sim/` world sim core (3D), headless RL env (`python/`, `headless/`), n8ao/postprocessing.
- Svelte admin (`admin.html`) — Reldens has full admin panel.
- Electron/Capacitor/mobile native shells (unless mobile later).
- Steam/Epic integrations, Discord bot (`bot/`), AWS SES email (Reldens has Mailer).
- Colyseus vs plain-ws: keep Colyseus (Reldens schema sync + rooms are fine for 2D MMO).
- 3D asset pipelines (`image-to-glb`, blender skills).

## 9. Build Order (suggested)

1. **Wallet login plugin** (new `lib/blockchain` feature module): port `wallet_link.ts` verify + challenge endpoints → hook `reldens.roomLoginOnAuth`. Env: `RELDENS_SOLANA_RPC_URL`, `RELDENS_WALLET_DISABLED`. Test: signature verify unit tests from CloudCraft `tests/wallet.test.ts`.
2. **Chat moderation**: port `chat_filter.ts` + `moderation_commands.ts` into `lib/chat`.
3. **Token balance proxy + holder tiers**: port `woc_balance.ts` + `holder_tier.ts` (cosmetic badges).
4. **NFT verify + entitlements**: port `seeker_genesis_token*.ts` pattern; mint/burn via items-system exchange hooks (build own).
5. **AI rules/hooks**: copy `.claude/hooks` + agent definitions now (free win).
6. **Server hardening**: msg_rate_limit + ws_backpressure into Colyseus rooms.

## 10. Files to Copy Reference (CloudCraft → Reldens)

```
world-of-claudecraft/server/wallet_link.ts        → lib/blockchain/server/wallet-verify.js
world-of-claudecraft/server/wallet.ts             → lib/blockchain/server/wallet-link-manager.js
world-of-claudecraft/server/ratelimit.ts          → lib/blockchain/server/rate-limit.js
world-of-claudecraft/server/woc_balance.ts        → lib/blockchain/server/token-balance.js
world-of-claudecraft/server/seeker_genesis_token.ts → lib/blockchain/server/nft-verify.js
world-of-claudecraft/server/chat_filter.ts        → lib/chat/server/profanity-filter.js
world-of-claudecraft/server/moderation_commands.ts → lib/chat/server/moderation-commands.js
world-of-claudecraft/server/msg_rate_limit.ts     → lib/rooms/server/msg-rate-limit.js
world-of-claudecraft/server/ws_backpressure.ts    → lib/rooms/server/ws-backpressure.js
world-of-claudecraft/server/totp.ts               → lib/users/server/totp.js (optional)
world-of-claudecraft/src/net/wallet.ts (client)   → lib/blockchain/client/wallet.js (adapt)
world-of-claudecraft/src/sim/holder_tier.ts       → lib/blockchain/server/holder-tier.js
world-of-claudecraft/.claude/hooks/*              → .claude/hooks/*
world-of-claudecraft/.claude/agents/* (subset)    → .claude/agents/*
world-of-claudecraft/server/CLAUDE.md             → lib/blockchain/CLAUDE.md (template)
```
