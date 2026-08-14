# 08 — Guia de IAs: Onde Olhar ao Desenvolver Cada Área

Regra de ouro: **Kaetram é somente leitura.** Cada IA lê o doc correspondente, olha o Kaetram para entender o padrão, e implementa do zero no nosso stack. Nunca colar código nem estrutura idêntica.

## Mapa por papel

### IA de Servidor (game server)

| Tarefa | Onde olhar no Kaetram | O que construir |
|---|---|---|
| Arquitetura geral do world | `packages/server/src/game/world.ts` | Nosso World/GameRoot com composição de sistemas |
| Transporte WebSocket + fila de envio | `src/network/{sockethandler,connection,network}.ts`, `sockets/uws.ts` | WS server próprio + batching por tick |
| Protocolo de mensagens | `packages/common/network/{packets,opcodes,packet,impl}` | Nosso pacote `common` com enum + classes |
| Loop de ticks | `world.ts` (intervals), `config.ts` (`updateTime`, `saveInterval`) | Nosso scheduler (ver `02-architecture-overview.md`) |
| Entidades e hierarquia | `src/game/entity/**` | Nossa hierarquia Entity→Character→Player/Mob/NPC/Objects |
| Combate/fórmulas | `src/game/entity/character/combat/`, `src/info/formulas.ts` | Nosso sistema de dano |
| Movimento/validação | `player/incoming.ts` (movement handlers), `map/map.ts` (`isColliding`) | Validação de steps autoritativa |
| Regions/streaming | `src/game/map/{regions,region}.ts` | Nossa divisão de mapa em chunks + fila de spawn |
| Grids espaciais/AoE | `src/game/map/grids.ts` | Nosso índice espacial |
| Skills | `player/skill/` (abstract + 18 impls) | Nosso sistema de skills (copiar conceito de abstract+impl, não código) |
| Quests | `player/quest/`, `data/quests/`, `data/quest_bases/` | Nosso sistema de quests com estágios |
| Guilds/Trade/Enchant | `controllers/{guilds,enchanter}.ts`, `player/trade.ts` | Nossos sistemas sociais |
| Minigames | `src/game/minigames/` | Nossas instâncias |
| Plugins de conteúdo | `data/plugins/{items,mobs}/` | Nosso padrão plugin + JSON |
| Persistência | `packages/common/database/mongodb/{loader,creator}.ts` | Nossa camada de DB (Prisma/Drizzle/driver) |
| Anti-abuso | `network/connection.ts` (rate-limit, reconexão), `sockets/uws.ts` (IP limit) | Nossas proteções |

### IA de Client

| Tarefa | Onde olhar no Kaetram | O que construir |
|---|---|---|
| Shell do jogo + multi-canvas | `components/game.astro`, `pages/index.astro` | Nossa página + layering de canvases (ou Phaser, ver abaixo) |
| Renderer 2D/WebGL | `src/renderer/{canvas,webgl,renderer,camera}.ts` | Nosso renderer (canvas 2D e/ou Phaser) |
| Carregamento de sprites | `src/controllers/sprites.ts`, `data/sprites.json` | Nosso manifesto de sprites |
| Map/regiões no client | `src/map/map.ts`, `utils/storage.ts` (IndexedDB) | Nosso cache de regiões |
| Entidades client-side | `src/entity/**`, `controllers/entities.ts` | Nossa fábrica de entidades + grid |
| UI (menus DOM) | `src/menu/*` (25 classes), `controllers/menu.ts` | Nossas telas de UI |
| Rede | `src/network/{socket,messages,connection}.ts` | Nossa camada de rede espelhando o `common` |
| Input (teclado/mouse/joystick) | `src/controllers/{input,joystick,pointer}.ts` | Nosso input |
| Áudio | `src/controllers/audio.ts` | Nosso áudio (Web Audio API) |
| Iluminação | `renderer.ts` (illuminated) | Nossa iluminação (lib própria ou similar MIT) |
| A* client-side | `lib/astar.ts`, `utils/pathfinder.ts` | Nosso pathfinding |
| i18n | `lib/i18n.ts`, `middleware/` | Nosso i18n |
| PWA/SEO | `astro.config.ts`, `lib/pwa.ts`, `layouts/default.astro` | Nossa PWA/SEO |

### IA de Mapa/Ferramentas

| Tarefa | Onde olhar | O que construir |
|---|---|---|
| Pipeline Tiled→JSON | `packages/tools/map/parser/{parser,exporter}.ts` | Nossa ferramenta de export (Tiled JSON → world.json + client meta) |
| Camadas especiais (entities, plateau, áreas) | `parser.ts` (nomes de layers, props de tile) | Nosso contrato de camadas do mapa |
| Replacer de tiles | `parser/replacer.ts` | Nossa ferramenta de substituição |

### IA de Infra/API/Hub

| Tarefa | Onde olhar | O que construir |
|---|---|---|
| Hub multi-servidor | `packages/hub/src/**` | Nosso gateway (se escalarmos horizontal) |
| API REST pública | `packages/hub/src/controllers/api.ts` | Nossa API (leaderboards, auth, reset) |
| Admin | `packages/admin/**` | Nosso painel admin |
| Leaderboards | `packages/hub/src/controllers/cache.ts` | Nossas aggregations |
| Email/Stripe | `mailer.ts`, `api.ts` | Nossas integrações |

### IA de Assets (específico nosso)

| Tarefa | Referência | O que construir |
|---|---|---|
| Catálogo de assets necessários | `07-asset-map-cc0.md` + inventário Kaetram (`client/public/**`) | Nosso registro de assets CC0 (nome, autor, URL, licença, hash) |
| Busca/filtro de assets | `07` (recursos de busca) | Downloads só de fontes verificadas; sempre com prova de licença |
| Auditoria pré-release | `07` (processo obrigatório) | Checklist: nenhum asset Kaetram/CC-BY-SA no repo |
| Produção própria | `07` (ordem de produção) | Paper-doll + identidade visual própria (comissão) |
| Áudio | `client/public/audio/**` (referência de catálogo) | Kenney audio + Juhani Junkala (CC0), mixagem própria |

### IA de QA/Testes

| Tarefa | Onde olhar no Kaetram | O que construir |
|---|---|---|
| E2E de login/inventário | `packages/e2e/**` (Cypress + cucumber + mock DB) | Nosso Playwright + Vitest, fixtures próprias |
| Teste de fórmulas | `src/info/formulas.ts` (sem testes isolados) | Nossos unit tests de dano/accuracy/drops |
| Teste de protocolo | `packages/common/network/` | Testes de serialização dos nossos packets |
| Smoke de mapa | `packages/tools/map/parser/` | Teste do nosso pipeline Tiled→JSON |

### IA de Web3/Blockchain (específico nosso — sem equivalente Kaetram)

| Tarefa | Referência | Notas |
|---|---|---|
| Auth por wallet | ver `09-web3-adaptation-notes.md` | Kaetram usa login/senha + guest — substituir |
| Itens NFT ↔ inventário | `common/network/impl/container.ts`, `equipment.ts` | Mapear itemId → tokenId; inventário server-side continua autoritativo |
| Metadata on-chain/off-chain | — | IPFS + JSON standard (ERC-721/1155) |
| Anti-cheat econômico | `network/connection.ts` | Reforçar validações: o que é NFT não pode ser duplicável |

## Workflow padrão de qualquer IA

1. Ler o doc do mapa correspondente (03–06, 10) + `01-license-boundaries.md`.
2. Abrir os paths indicados no Kaetram **somente para entender o padrão**.
3. Escrever no nosso repo especificação curta (comentário de PR ou ticket): "padrão X do Kaetram → nossa implementação Y".
4. Implementar do zero no nosso stack.
5. Conferir: nenhum trecho do Kaetram entrou; nenhum asset deles foi usado.

## Pontos de atenção (evitar armadilhas do Kaetram)

- Pathfinding server-side é TODO deles — decidir se faremos server-side desde o início (mais seguro anti-cheat) ou client-side como eles.
- `player.ts` com 2.7k linhas = god-class; nós devemos compor melhor.
- Callbacks em vez de event emitter: funcional, mas para nosso Web3 (mais integrações) um event bus pode ajudar; decisão de arquitetura nossa.
- `socket.io-client` e `gl-tiled` declarados mas não usados — não repetir dependências mortas.
