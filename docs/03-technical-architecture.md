# 03 — Arquitetura Técnica e Stack

> Camada técnica. Consolida stack, decisões de arquitetura e integração Web3.
> Referências profundas: `cloudcraft-mapping.md` (port) e `kaetram-map/02..09`.

---

## 1. Stack base (herdada do Reldens)

| Camada | Tecnologia | Nota |
|---|---|---|
| Server MMO | **Colyseus 0.16** (rooms, schema sync, WS) | autoritativo |
| Client | **Phaser 3** + **Parcel** (bundle) | renderização 2D |
| Runtime | **Node >= 20**, JS CommonJS | — |
| DB | **multi-ORM** (`prisma` default; objection-js / mikro-orm) | via `@reldens/storage` |
| Utils | `@reldens/utils`, `@reldens/server-utils`, `@reldens/modifiers`, `@reldens/skills`, `@reldens/items-system`, `@reldens/cms` | sub-packages |

**Decisão**: manter o stack Reldens intacto (Colyseus + Phaser + Parcel). Não migrar
para uWS/Astro (stack Kaetram) — o Reldens já resolve rooms, schema, skills, items,
modifiers e CMS. O Kaetram serve de **referência conceitual**, não de runtime.

---

## 2. Web3 stack (adicionada)

| Função | Escolha | Status |
|---|---|---|
| Assinatura ed25519 (verify) | `@noble/curves` + `bs58` | ✅ já em uso |
| Wallet Standard (client) | `@solana/wallet-standard-*`, `@wallet-standard/*` | ✅ deps instaladas |
| Chain | **Solana** (verify + RPC balance + Token-2022 NFT) | ✅ implementado |
| Lib EVM (se migrar) | `viem` (MIT) ou `ethers` (MIT) | 🔮 opcional |
| Contratos | Solidity + Hardhat/Foundry | 🔮 fase v1 |
| Metadata NFT | IPFS (pinata/nó próprio) ou Arweave | 🔮 fase v1 |
| Indexador | viem listeners ou The Graph | 🔮 fase v1 |

### Por que Solana primeiro (e não Ronin como Pixels)

- O port de CloudCraft já era Solana (verify, Token-2022 NFT, holder tier) → reuso direto.
- Baixo custo/gas, rápido — bom para ações frequentes de jogo.
- **O padrão de verify é chain-agnóstico**: trocar para EVM = substituir
  `verifySolanaSignature` por `verifyMessage` (viem) e o RPC de balance por
  `readContract`. O restante (challenge, rate limit, holder tier, plugin) se mantém.

---

## 3. Estrutura de diretórios (módulos)

```
lib/
├── blockchain/          # ✅ wallet, token, NFT, holder, rate limit
├── chat/                # ✅ chat + moderação (2-tier, comandos)
├── users/               # ✅ scrypt, totp, auth-throttle, username-guard
├── rooms/               # ✅ msg-rate-limit, ws-backpressure
├── crafting/            # 🟡 novo (plugin list/start/craft + UI)
├── quests/              # 🔴 novo
├── energy/              # 🔴 novo
├── farming/             # 🔴 novo
├── {shop, pets, ...}    # 🔴 novos (fases seguintes)
└── {23 módulos nativos} # game, rooms, world, config, actions, inventory, ...
```

**Padrão de módulo** (herdado de Reldens + reforçado pelo port):
```
lib/{feature}/
├── constants.js
├── client/plugin.js + UI
├── server/plugin.js + lógica + entities/
└── CLAUDE.md (invariantes, persistência, testes)
```

---

## 4. Fluxo de dados (end-to-end)

```
Cliente (Phaser + wallet)
   │  1. guest/login + (wallet: challenge→assinatura)
   ▼
Login Room (Colyseus onAuth)
   │  2. BlockchainPlugin valida assinatura (consome nonce, verify, link)
   ▼
Game Room (autoritativo)
   │  3. ações (farmar/craftar/quest/compra) → servidor valida (energia, itens, exp)
   │  4. se envolver NFT/token → RPC read-only (balance/posse) com cache TTL
   ▼
Persistência (DB via dataServer.getEntity()) + broadcast (schema sync)
```

**Invariantes** (do `lib/blockchain/CLAUDE.md`):
- Servidor **nunca** constrói/transmite transações — só verifica assinatura e lê chain.
- Secrets (`RELDENS_*`) nunca vão ao client.
- Nonce single-use + TTL; verify antes de link.
- Cache TTL para balance/posse; nunca query por tick/mensagem.
- Client recebe só campos públicos (endereço parcial, tier), nunca tokens/nonces.

---

## 5. Persistência (novas tabelas)

| Tabela | Uso | Status |
|---|---|---|
| `blockchain_wallets` | wallet vinculada por conta (address, tier, timestamps) | ✅ migration |
| `blockchain_wallet_challenges` | nonce/desafio (single-use, TTL) | ✅ migration |
| `crafting_recipes` | receitas (skill, level, exp, resultado) | 🟡 migration criada |
| `crafting_recipes_items` | requisitos/inputs por receita | 🟡 migration criada |
| `quests` + `quest_progress` | quests e progresso por player | 🔴 a criar |
| `energy` (ou coluna em player) | energia/cap/última regen | 🔴 a criar |

**Regra**: schema via `migrations/` → `reldens generateEntities --override`. Nunca
editar `generated-entities/` (hook bloqueia).

---

## 6. Segurança (hardening portado)

| Proteção | Onde | Status |
|---|---|---|
| Rate limit (fused ip+account) | `lib/blockchain/server/rate-limit.js`, `lib/users/server/auth-throttle.js` | ✅ |
| Profanity 2-tier | `lib/chat/server/profanity-filter.js` | ✅ |
| Comandos moderação | `lib/chat/server/moderation-commands.js` | ✅ |
| Flood gate pre-parse | `lib/rooms/server/msg-rate-limit.js` | ✅ |
| WS backpressure (bufferedAmount kill) | `lib/rooms/server/ws-backpressure.js` | ✅ |
| scrypt + compare constante | `lib/users/server/scrypt.js` | ✅ |
| TOTP 2FA | `lib/users/server/totp.js` | ✅ (opcional) |
| Anti-bot (IP block seam) | — | 🔴 fase futura (faucet/NFT claim) |

---

## 7. Testes

- **Unidade pura** (rápidos, sem servidor): `tests/test-{blockchain-*, chat-filter,
  moderation-commands, msg-rate-limit, scrypt, totp, auth-throttle}.js` — já escritos.
- **Gate de release**: `npm test` (sobe servidor real).
- **Pré-push**: `.githooks/pre-push` roda os testes puros + guards de copy.
- **Novos módulos** (crafting/quests/energy/farming) devem seguir o mesmo padrão:
  lógica pura (fórmulas, validação) testável sem servidor.

---

## 8. Decisões técnicas em aberto

| Decisão | Opções | Impacto |
|---|---|---|
| **Chain final** | Solana (atual) vs EVM (Ronin/Base/Polygon) | Trocar camada de verify; o resto se mantém. |
| **Custódia** | Escrow contract vs movimentação só por assinatura do jogador | v1: só assinatura do jogador (mais simples/seguro). |
| **Pathfinding** | Client-side (como Kaetram) vs server-side | Server-side = anti-cheat melhor; decidir cedo. |
| **Event bus vs callbacks** | Reldens usa EventsManagerSingleton | Manter EventsManager (padrão nativo). |
| **Mono-token vs dual** | — | Afeta economia/contratos (ver `02` §10). |

---

## 9. Topologia alvo (v1)

```
Browser (Phaser + wallet) ──WS──> Reldens Server (Colyseus, autoritativo)
                                      │  valida posse/balance via RPC (cache TTL)
                                      ├──> DB (prisma/multi-ORM)
                                      └──> Solana RPC (read-only)
Server ──(eventos de contrato)──> Indexador (viem) ──> atualiza estado (fase v1)
Server ──> IPFS (metadata de itens NFT) (fase v1)
```

Escala horizontal (hub multi-servidor) = fase futura; padrão de referência em
`kaetram-map/06-hub-api-admin-tools-map.md`.
