# 00 - Plano Mestre do Jogo (North Star)

Este é o documento raiz. Ele consolida o levantamento geral do projeto, o rumo do
jogo (baseado em Pixels.xyz) e aponta para toda a documentação existente. É o
primeiro arquivo que qualquer IA deve ler antes de começar qualquer tarefa.

> **Status deste doc**: vivo, revisado a cada decisão de produto. Data da última
> consolidação: 2026-08-14.

---

## 1. O que estamos construindo (resumo executivo)

Um **MMORPG 2D browser-native, top-down, pixel-art, estilo Pixels.xyz**, com
economia **Web3/NFT** (play-and-earn leve, não ponzi), desenvolvido **100% por IA**
sobre a plataforma **Reldens** (Phaser 3 + Colyseus 0.16 + Node 20), portando
padrões de código de projetos maduros (CloudCraft, Kaetram, upstreams Phaser) e
usando **somente assets CC0 ou próprios**.

- **Proposta**: "cultive, crie, explore e ganhe" - um universo de fazenda/aventura
  com terras NFT, crafting, quests, energia e economia em token.
- **Nome final**: **VibeCraft** (decisão do dono; ver `01-game-vision.md` §2).
- **Chain alvo**: Solana (já implementado) - decisão aberta de manter Solana ou
  migrar para EVM/Ronin (ver `03-technical-architecture.md` §8).

---

## 2. Índice da documentação

### Camada de Produto / Game Design (esta seção)

| Doc | Conteúdo |
|---|---|
| `00-master-plan.md` | **Este arquivo.** Levantamento geral + índice. |
| `01-game-vision.md` | Proposta, nome/branding, referência Pixels.xyz, posicionamento, critérios de sucesso. |
| `02-game-mechanics.md` | Mecânicas e economia: mapeamento Pixels.xyz → nossos sistemas (farming, energia, crafting, quests, shop, guilds, NFT). |
| `03-technical-architecture.md` | Stack, arquitetura, decisões técnicas, integração Web3, decisões em aberto. |
| `04-roadmap.md` | Fases/milestones + estado atual do que já foi feito e do que falta. |
| `05-creature-mechanics.md` | Mecânicas de personagens/mobs/criaturas (tipos de dano, fraquezas, drops, spawn override) - padrão Kaetram portado. |
| `06-development-process.md` | **LER ANTES DE ATUAR (todas as IAs).** Runner único `dev.mjs`, anti-duplicata de servidor, hot reload, uma janela de logs. |

### Camada de Portabilidade / Referência (já existente)

| Doc | Conteúdo |
|---|---|
| `cloudcraft-mapping.md` | Mapa de port de CloudCraft → Reldens (wallet, NFT, chat, auth, hardening, regras IA). |
| `kaetram-map/00-README.md` | Índice do mapeamento do Kaetram-Open (arquitetura de referência). |
| `kaetram-map/01-license-boundaries.md` | **LER ANTES DE TUDO** - limites legais (MPL-2.0 / OPL / CC-BY-SA). |
| `kaetram-map/02..10` | Arquitetura, server, client, common, hub, assets CC0, guia de IAs, Web3, gameplay. |

### Regras de IA e hooks (já existente)

| Local | Conteúdo |
|---|---|
| `.claude/hooks/README.md` | Hooks de QA (deny-generated-edit, qa-stop, ensure-hooks). |
| `.claude/agents/*.md` | Reviewers read-only (hot-path, security, migration-safety). |
| `.claude/karpathy-guidelines.md` | Diretrizes de engenharia (Karpathy-style). |
| `lib/blockchain/CLAUDE.md`, `lib/chat/CLAUDE.md` | Invariantes por módulo. |

---

## 3. Levantamento geral - estado do projeto hoje (2026-08-14)

### 3.1 O que já está PRONTO (portado e testado)

| Área | Local | Status |
|---|---|---|
| **Blockchain (Solana)** - wallet link (challenge + assinatura), token balance, holder tier, NFT verify, rate limit, plugin server/client | `lib/blockchain/` | [ok] implementado + testes |
| **Moderação de chat** - filtro profanity 2-tier, comandos /mute /ban, rate limit, ws backpressure | `lib/chat/`, `lib/rooms/server/` | [ok] implementado + testes |
| **Auth hardening** - scrypt, TOTP, auth-throttle, username-guard | `lib/users/server/` | [ok] implementado + testes |
| **Regras de IA** - hooks, agents, CLAUDE.md por diretório | `.claude/` | [ok] ativo |
| **Migrations** - `blockchain-*.sql`, `beta.40-*.sql` (crafting, quests, energy, farming, chests, shop) | `migrations/development/` | [ok] criadas |
| **Blockchain extra** - faucet, NFT binding, HTTP routes, tier badge, wallet UI | `lib/blockchain/` | [ok] implementado + testes |
| **Testes unitários** (sem servidor) | `tests/test-*.js` (23 arquivos) | [ok] 20/20 verificados passando (`test-admin-*` não rodados; requerem servidor) |

### 3.2 O que está EM ANDAMENTO / PENDENTE

| Feature | Status | Próximo passo |
|---|---|---|
| **Crafting** | [ok] código + objeto `craft_station_1` (custom class) registrados no theme | validar fluxo no jogo |
| **Quests/Tasks** | [ok] plugin server+client, manager, entities, migrations, teste; registrado no theme | validar fluxo no jogo |
| **Energy system** | [ok] manager, plugin, message-actions, migration, teste; registrado no theme | validar fluxo no jogo |
| **Farming** | [ok] farm-object, manager, client UI, migrations, teste; objeto `farm_plot_1` registrado | validar fluxo no jogo |
| **Chests (loot)** | [ok] `chest-object.js` registrado como objeto `chest` no theme | validar fluxo no jogo |
| **Status effects** | [ok] plugin + manager + message-actions; registrado no theme | validar fluxo no jogo |
| **Land (NFT gate)** | [ok] plugin registrado no theme | configurar `gatedRooms` no DB |
| **Shop NPC** (compra/venda) | [~] demo-data + `TraderObject` core; UI faltando | validar fluxo shop→farming→crafting |
| **Tilesets CC0 + mapas novos** | [~] editor de assets e mapas criado (`/editor`) | criar mapas + selecionar assets |
| **Verificação geral** | [~] 20 testes puros passando; `npm test` completo pendente | rodar migrations `beta.40-*` + `npm test` |

> **Nota de estado (2026-08-14):** os módulos `crafting/quests/energy/farming/chests/land/status-effects` são
> registrados no jogo via `theme/plugins/server-plugin.js` (custom classes de objetos + plugins), não em
> `lib/features/server/config-server.js`. Crafting, farming e chests não precisam de `server/plugin.js`: entram
> como classes custom de objeto (ex.: `craft_station_1`, `farm_plot_1`, `chest`).

### 3.3 Os 3 agentes em atuação (workstreams atuais)

1. **Port CloudCraft → Reldens** - blockchain, chat, auth, regras IA (praticamente concluído; falta verificação geral).
2. **Mapeamento Kaetram-Open** - base de estudo de arquitetura/assets (docs `kaetram-map/` concluídos).
3. **Gameplay Pixels-like** - crafting, quests, energia, status, shop, tilesets (em andamento).

---

## 4. Regras transversais (obrigatórias para toda IA)

1. **Licença**: nada do Kaetram (código ou asset) entra no produto - OPL proíbe NFT/cripto. Só CC0 ou próprio. (ver `kaetram-map/01-license-boundaries.md`).
2. **Portamos padrões, não código**: CloudCraft/Kaetram são referência conceitual; implementamos do zero no stack Reldens.
3. **Servidor autoritativo**: toda lógica (economia, drops, NFT, combate) roda no servidor; cliente só exibe.
4. **Secrets server-side**: RPC URLs, mints, chaves nunca vão ao bundle do cliente.
5. **Sempre `dataServer.getEntity()`**, nunca SQL raw; schema via `migrations/` + `reldens generateEntities --override`.
6. **Testes**: unidade pura para tudo que é fórmula/lógica (padrão dos testes novos); `npm test` (servidor) é o gate de release.
7. **Regras de QA** (hooks) valem em toda edição: sem emojis, sem em/en dashes, sem `.only(`, sem `console.log` em `lib/` server, sem editar `generated-entities/`.

---

## 5. Decisões-chave em aberto (para o dono do projeto)

Decisões que faltam travar o rumo:

1. **Nome final**: **[ok] VibeCraft** (decisão do dono, 2026-08-14; ver `01-game-vision.md` §2).
2. **Chain final**: manter **Solana** (já pronto) ou migrar para **EVM** (Ronin/Base/Polygon) para aproximar de Pixels.xyz?
3. **Token único vs dual**: só um token de utilidade, ou dupla ($TOKEN + moeda soft in-game) como Pixels ($PIXEL + $BERRY)?
4. **Modelo de terra**: land NFT como core (Pixels) ou land como expansão futura?
5. **Free-to-play + guest** (já temos) com wallet como upgrade - confirmar que NFT fica trancado para guest.

---

## 6. Como usar este repo para continuar o trabalho

1. Ler este doc + o doc da camada correspondente (produto vs portabilidade).
2. Se for mexer em blockchain/chat, ler o `CLAUDE.md` do módulo antes.
3. Criar/atualizar migration → gerar entities → plugin server → plugin client → testes.
4. Nunca commitar sem passar pelos hooks (rodam sozinhos a cada turno) e, antes de release, rodar `npm test`.
