# 02 — Arquitetura Geral (Visão de Topo)

Base: `F:\Kaetram-Open\README.md`, `package.json` raiz, estrutura `packages/`.

## Conceito

Kaetram-Open = MMO 2D browser **top-down** (sucessor do BrowserQuest), 16px tiles, servidor autoritativo, cliente apenas renderiza. Node.js + TypeScript estrito, monorepo Yarn workspaces.

## Pacotes (workspaces)

| Pacote | Papel | Stack chave |
|---|---|---|
| `@kaetram/common` | Camada compartilhada: protocolo de rede, config, DB, i18n, utils | TypeScript puro, sem `src/` (código na raiz) |
| `@kaetram/server` | Game server autoritativo (world, entidades, lógica) | uWebSockets.js, Express, mongodb driver |
| `@kaetram/hub` | Gateway multi-servidor + API pública (leaderboards, reset, Stripe) | uWebSockets.js, Express, Stripe, nodemailer |
| `@kaetram/client` | Client browser (game + site) | Astro 3, canvas 2D/WebGL, pako, i18next |
| `@kaetram/admin` | Painel admin (monitor de servidores) | Astro, WebSocket |
| `@kaetram/tools` | Pipeline de mapas (Tiled → world.json) | Scripts tsx |
| `@kaetram/e2e` | Testes end-to-end | Cypress + cucumber |

## Topologia de rede

```
Cliente (browser) ──WebSocket──> Game Server (uWS)
                                  │
Game Server ──WebSocket──> HUB ──┤──> outros Game Servers
                                  │
Admin panel ──WebSocket──> HUB    │
Cliente ──HTTP──> HUB (GET /server → escolhe servidor)
Cliente ──HTTP──> HUB API (leaderboards, reset senha)
Game Server ──REST──> HUB API (isOnline, leaderboards)
Discord <──bot──> Game Server e HUB (chat bridge)
```

- Cliente fala **só** com 1 game server por sessão; hub roteia no login.
- Hub = ponto de cross-server: chat privado, guilds, friends, status online.
- Compression: desativada no game server (mensagens JSON pequenas); `DEDICATED_COMPRESSOR_3KB` no hub; mapa comprimido com zlib (pako no client).

## Fluxo de vida de uma conexão

1. Cliente carrega site (Astro), `GET {hub}/server` → recebe host/port do servidor com vaga.
2. WebSocket conecta no game server → `Handshake` (versão) → `Login` (guest/register/login).
3. Servidor responde `Welcome` (dados completos do player) → cliente manda `Ready`.
4. Servidor envia regiões do mapa (comprimidas), lista de entidades, posições.
5. Loop: cliente manda input (movimento/combate/chat), servidor valida e retransmite.

## Loop de jogo (sem game loop tradicional)

- **Sem tick global.** Mundo roda em 2 intervals no `World`:
  - `updateTime` (300ms): flush de pacotes em fila (`network.parse()`) + spawns de região (`regions.parse()`).
  - `saveInterval` (60s): save de todos os players.
- Intervals por entidade: heal (7s), efeitos (10s), combate (`attackRate/4`), skill loop (1s), respawn.
- Movimento: cliente manda steps; servidor valida colisão por passo.

## Princípios de design (o que replicamos)

1. **Content-as-data**: todo conteúdo (itens, mobs, quests, skills) em JSON + classes de comportamento (plugins). Banco = somente estado do player.
2. **Monorepo + pacote comum**: protocolo de rede definido 1x, compartilhado client/server (enum de packets).
3. **Servidor autoritativo**: cliente envia intenção, servidor valida e propaga estado.
4. **Region streaming**: mapa dividido em chunks de 48 tiles; cliente recebe só o que vê e cacheia (IndexedDB).
5. **Registry pattern**: `index.ts` exporta dicionário de implementações; instanciação por chave (`new Index[key]()`) — hook de extensibilidade em quests, skills, plugins, minigames, áreas.
6. **Separação Handler/Entidade**: `Player` tem `Handler`, `Incoming`, etc. — callback wiring separado do estado.
7. **Tipagem estrita + ESM**: `strict`, `verbatimModuleSyntax`, `type: module`, sem classes ORM.

## Stack para nosso jogo (referência)

| Área | Kaetram usa | Alternativa permissiva para nós |
|---|---|---|
| Transporte WS | uWebSockets.js (Apache-2.0) | mesmo, ou Colyseus (MIT), ou ws (MIT) |
| DB | MongoDB driver (Apache-2.0) | MongoDB/Postgres + Prisma (Apache-2.0) |
| Client | Astro + canvas próprio | Astro/Vite + canvas próprio ou Phaser (MIT) |
| Compressão | pako (MIT) | mesmo |
| Monorepo | Yarn workspaces | Yarn/pnpm workspaces |
| Testes | Cypress + cucumber | Playwright (Apache-2.0) + Vitest (MIT) |

Todos acima são licenças permissivas independentes — nada a ver com MPL/OPL do Kaetram.
