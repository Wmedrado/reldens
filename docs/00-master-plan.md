# 00 — Plano Mestre do Jogo (North Star)

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

- **Proposta**: "cultive, crie, explore e ganhe" — um universo de fazenda/aventura
  com terras NFT, crafting, quests, energia e economia em token.
- **Nome provisório**: **PixVale** (ver `01-game-vision.md` §2 para opções).
- **Chain alvo**: Solana (já implementado) — decisão aberta de manter Solana ou
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

### Camada de Portabilidade / Referência (já existente)

| Doc | Conteúdo |
|---|---|
| `cloudcraft-mapping.md` | Mapa de port de CloudCraft → Reldens (wallet, NFT, chat, auth, hardening, regras IA). |
| `kaetram-map/00-README.md` | Índice do mapeamento do Kaetram-Open (arquitetura de referência). |
| `kaetram-map/01-license-boundaries.md` | **LER ANTES DE TUDO** — limites legais (MPL-2.0 / OPL / CC-BY-SA). |
| `kaetram-map/02..10` | Arquitetura, server, client, common, hub, assets CC0, guia de IAs, Web3, gameplay. |

### Regras de IA e hooks (já existente)

| Local | Conteúdo |
|---|---|
| `.claude/hooks/README.md` | Hooks de QA (deny-generated-edit, qa-stop, ensure-hooks). |
| `.claude/agents/*.md` | Reviewers read-only (hot-path, security, migration-safety). |
| `.claude/karpathy-guidelines.md` | Diretrizes de engenharia (Karpathy-style). |
| `lib/blockchain/CLAUDE.md`, `lib/chat/CLAUDE.md` | Invariantes por módulo. |

---

## 3. Levantamento geral — estado do projeto hoje (2026-08-14)

### 3.1 O que já está PRONTO (portado e testado)

| Área | Local | Status |
|---|---|---|
| **Blockchain (Solana)** — wallet link (challenge + assinatura), token balance, holder tier, NFT verify, rate limit, plugin server/client | `lib/blockchain/` | ✅ implementado + testes |
| **Moderação de chat** — filtro profanity 2-tier, comandos /mute /ban, rate limit, ws backpressure | `lib/chat/`, `lib/rooms/server/` | ✅ implementado + testes |
| **Auth hardening** — scrypt, TOTP, auth-throttle, username-guard | `lib/users/server/` | ✅ implementado + testes |
| **Regras de IA** — hooks, agents, CLAUDE.md por diretório | `.claude/` | ✅ ativo |
| **Migrations** — `blockchain-wallets-tables.sql`, `beta.40-crafting-tables.sql` | `migrations/development/` | ✅ criadas |
| **Testes unitários** (sem servidor) | `tests/test-*.js` (13 arquivos novos) | ✅ escritos |

### 3.2 O que está EM ANDAMENTO / PENDENTE

| Feature | Status | Próximo passo |
|---|---|---|
| **Crafting** | 🟡 tabelas + migration + entities feitas; plugin server + UI **faltam** | `lib/crafting/server/plugin.js` (list/start/craft, validação, consumo, exp) |
| **Quests/Tasks** | 🔴 tabelas + plugin server **faltam** | `lib/quests/` (task board + claim) |
| **Energy system** | 🔴 não iniciado | stat + regen timer + boost VIP |
| **Status effects** (via skills/modifiers) | 🔴 avaliar caso a caso | hooks em `@reldens/modifiers` |
| **Shop NPC** (compra/venda) | 🔴 não iniciado | `lib/` novo módulo ou objeto NPC + stores |
| **Tilesets CC0 + mapas novos (0x72)** | 🔴 não iniciado | assets + mapas Tiled próprios |
| **Instalação de deps + teste geral** | 🟡 falta rodar | `npm install` + `npm test` completo |

### 3.3 Os 3 agentes em atuação (workstreams atuais)

1. **Port CloudCraft → Reldens** — blockchain, chat, auth, regras IA (praticamente concluído; falta verificação geral).
2. **Mapeamento Kaetram-Open** — base de estudo de arquitetura/assets (docs `kaetram-map/` concluídos).
3. **Gameplay Pixels-like** — crafting, quests, energia, status, shop, tilesets (em andamento).

---

## 4. Regras transversais (obrigatórias para toda IA)

1. **Licença**: nada do Kaetram (código ou asset) entra no produto — OPL proíbe NFT/cripto. Só CC0 ou próprio. (ver `kaetram-map/01-license-boundaries.md`).
2. **Portamos padrões, não código**: CloudCraft/Kaetram são referência conceitual; implementamos do zero no stack Reldens.
3. **Servidor autoritativo**: toda lógica (economia, drops, NFT, combate) roda no servidor; cliente só exibe.
4. **Secrets server-side**: RPC URLs, mints, chaves nunca vão ao bundle do cliente.
5. **Sempre `dataServer.getEntity()`**, nunca SQL raw; schema via `migrations/` + `reldens generateEntities --override`.
6. **Testes**: unidade pura para tudo que é fórmula/lógica (padrão dos testes novos); `npm test` (servidor) é o gate de release.
7. **Regras de QA** (hooks) valem em toda edição: sem emojis, sem em/en dashes, sem `.only(`, sem `console.log` em `lib/` server, sem editar `generated-entities/`.

---

## 5. Decisões-chave em aberto (para o dono do projeto)

Estas decisões de produto devem ser confirmadas para travar o rumo:

1. **Nome final** (opções em `01-game-vision.md` §2).
2. **Chain final**: manter **Solana** (já pronto) ou migrar para **EVM** (Ronin/Base/Polygon) para aproximar de Pixels.xyz?
3. **Token único vs dual**: só um token de utilidade, ou dupla ($TOKEN + moeda soft in-game) como Pixels ($PIXEL + $BERRY)?
4. **Modelo de terra**: land NFT como core (Pixels) ou land como expansão futura?
5. **Free-to-play + guest** (já temos) com wallet como upgrade — confirmar que NFT fica trancado para guest.

---

## 6. Como usar este repo para continuar o trabalho

1. Ler este doc + o doc da camada correspondente (produto vs portabilidade).
2. Se for mexer em blockchain/chat, ler o `CLAUDE.md` do módulo antes.
3. Criar/atualizar migration → gerar entities → plugin server → plugin client → testes.
4. Nunca commitar sem passar pelos hooks (rodam sozinhos a cada turno) e, antes de release, rodar `npm test`.
