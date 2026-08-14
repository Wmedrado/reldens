# 04 - Roadmap e Estado Atual

> Plano por fases + status detalhado de cada item. Mantém o "o que falta" sempre
> visível para orquestrar as IAs. Atualizar a cada milestone.

---

## 1. Estado atual consolidado (2026-08-14)

### [ok] Concluído (port + hardening)

| Item | Artefatos | Testes |
|---|---|---|
| Wallet auth Solana (challenge + verify + link) | `lib/blockchain/server/{wallet-verify,wallet-link-manager,plugin}.js` | `test-blockchain-wallet-verify.js` |
| Token balance + holder tier | `lib/blockchain/server/{token-balance,holder-tier}.js` | `test-blockchain-token-balance.js`, `test-blockchain-holder-tier.js` |
| NFT verify (Token-2022) + ownership | `lib/blockchain/server/{nft-verify,ownership-verifier}.js` | - (unit a adicionar) |
| Rate limit / anti-abuso | `lib/blockchain/server/rate-limit.js` | - |
| Client wallet | `lib/blockchain/client/{plugin,wallet}.js` | - |
| Chat: profanity 2-tier | `lib/chat/server/profanity-filter.js` | `test-chat-filter.js` |
| Chat: comandos moderação | `lib/chat/server/{moderation-commands,moderation-service}.js` | `test-moderation-commands.js` |
| Chat: rate limit + backpressure | `lib/rooms/server/{msg-rate-limit,ws-backpressure}.js` | `test-msg-rate-limit.js` |
| Auth: scrypt / TOTP / throttle | `lib/users/server/{scrypt,totp,auth-throttle}.js` | `test-scrypt.js`, `test-totp.js`, `test-auth-throttle.js` |
| Regras IA (hooks + agents + CLAUDE.md) | `.claude/` | - |
| Migrations blockchain + crafting | `migrations/development/` | - |
| Docs de referência (Kaetram + CloudCraft) | `docs/` | - |

### [~] Código pronto - wire-up pendente (gameplay Pixels-like)

> Módulos registrados no jogo via `theme/plugins/server-plugin.js` (custom classes de objeto +
> plugins). Crafting/farming/chests entram como classes custom (`craft_station_1`, `farm_plot_1`,
> `chest`) e não têm `server/plugin.js`. Falta validar fluxo no jogo + rodar migrations `beta.40-*`.

| Item | Artefatos | Próximo passo |
|---|---|---|
| Crafting (tabelas + objeto + UI) | `migrations/development/beta.40-crafting-*.sql`, `lib/crafting/` | validar fluxo no jogo |
| Quests (tabelas + plugin server + UI) | `migrations/development/beta.40-quests-*.sql`, `lib/quests/` | validar fluxo no jogo |
| Energy (stat + regen + VIP boost) | `migrations/development/beta.40-energy.sql`, `lib/energy/` | validar fluxo no jogo |
| Farming (plots + timers lazy) | `migrations/development/beta.40-farming-*.sql`, `lib/farming/` | validar fluxo no jogo |
| Shop NPC (compra/venda) | `migrations/development/beta.40-shop-demo-data.sql` (usa `TraderObject` core + moeda soft) | validar fluxo + UI |
| Chests (loot com cooldown) | `migrations/development/beta.40-chests-demo-data.sql`, `lib/chests/` | validar fluxo no jogo |
| Status effects (timed effects) | `lib/status-effects/` (plugin + manager + message-actions) | validar fluxo no jogo |
| Land (NFT gate em salas) | `lib/land/` (plugin) | config `gatedRooms` no DB |
| Editor (assets + mapas) | `lib/editor/` (servido em `/editor`) | criar mapas + selecionar assets |
| Blockchain extra: faucet / nft-binding / http-routes | `lib/blockchain/server/{faucet,nft-binding,http-routes}.js` | [ok] código + testes; `performOnChainOp` é stub |

### Em andamento

| Item | Próximo passo | Bloqueado por |
|---|---|---|
| **Creature mechanics** (tipos de dano) | [ok] Fases 1-3: `damage-types.js` + listener + `enemy-object.loadDamageTypes()` + drop tables (`drop-tables-loader/processor`) + testes (`test-damage-types.js`, `test-drop-tables.js`); migration `beta.41` aplicada + entities geradas | Fase 4/5 documentadas; validar fluxo no jogo |
| Validação gameplay no jogo | rodar migrations `beta.40-*` + validar ciclo shop→farming→crafting→quests | - |
| Verificação geral | `npm test` completo | servidor ativo |
| Assets + mapas | usar o editor `/editor` para selecionar assets e desenhar mapas | - |

### Pendente (gameplay Pixels-like)

| Item | Dependência |
|---|---|
| Seleção de assets CC0 (paper-doll, ~600 itens) | asset pipeline (`/editor`) |
| Mapas do jogo (town + farm) desenhados no editor | `/editor` |
| Skills registradas (farming, cooking, woodcutting, mining, fishing) | farming/crafting prontos |
| Terras NFT (mint/verify) como gate de plots premium | Fase 2 (Web3) |

---

## 2. Fases do roadmap

### Fase 0 - Fundação (≈ concluída)
- [x] Port blockchain + chat + auth + hardening (CloudCraft → Reldens).
- [x] Regras IA (hooks/agents/CLAUDE.md).
- [x] Migrations base.
- [x] Docs de referência (Kaetram, CloudCraft, master plan).
- [ ] **`npm install` + rodar todos os testes + corrigir falhas.** ← PRÓXIMO GATE

### Fase 1 - MVP jogável (sem chain obrigatório)
- [x] Farming básico (plantar/colher + inventário). - objeto `farm_plot_1` registrado
- [x] Crafting completo (objeto + UI). - objeto `craft_station_1` registrado
- [x] Quests simples (task board + claim). - plugin registrado
- [x] Energy (regen + custo). - plugin registrado
- [x] Shop NPC (moeda soft, via `TraderObject` core). - demo-data pronto; UI pendente
- [x] Chests (loot + cooldown). - objeto `chest` registrado
- [x] Status effects. - plugin registrado
- [x] Land (NFT gate). - plugin registrado
- [ ] Mapas do jogo (town + farm) desenhados no editor `/editor`.
- [ ] Seleção de assets CC0 via editor (paper-doll, ~600 itens).
- [ ] Skills registradas (farming, cooking, woodcutting, mining, fishing).
- [ ] UI cliente para tudo acima.

### Fase 2 - Web3 / NFT (v1)
- [ ] Terras NFT (mint/verify) como gate de plots premium.
- [ ] Itens NFT (mint em craft/conquista, badge, burn).
- [ ] Token de utilidade + faucets/sinks.
- [ ] Marketplace / transfer de itens NFT.
- [ ] VIP (holding) com boost energia/xp/drops.

### Fase 3 - Social / Escala
- [ ] Guilds (adaptar `teams`).
- [ ] Pets NFT.
- [ ] Eventos sazonais / leaderboards (hub).
- [ ] Hub multi-servidor (padrão Kaetram).
- [ ] Cross-server chat/friends.

---

## 3. Ordem de execução recomendada (próximas tarefas das IAs)

1. **Validar gameplay**: rodar migrations `beta.40-*` e validar o ciclo shop→farming→crafting→quests no jogo.
2. **Skills registradas**: farming, cooking, woodcutting, mining, fishing (dados em `skills`/`objects_skills` + exp wiring).
3. **Assets + mapas**: usar o editor `/editor` para selecionar assets CC0 e desenhar os mapas town + farm.
4. **Status effects**: avaliar cobertura do `@reldens/modifiers` antes de escrever código.
5. **Fase 2 - Web3**: terras NFT como gate de plots premium, itens NFT (mint/burn), token de utilidade, marketplace, VIP holding boost.

---

## 4. Critérios de "done" por feature

- Tabelas via migration + entities geradas (`--override`).
- Plugin server com lógica autoritativa (validação, consumo, exp, persistência).
- Plugin client + UI (Phaser) funcionando contra o server.
- Testes unitários para lógica pura (fórmulas/validação).
- `CLAUDE.md` do módulo atualizado (invariantes + persistência + testes).
- Sem violação de licença (nenhum asset/código Kaetram/CC-BY-SA).
- Passa nos hooks de QA (sem `.only(`, `debugger`, `console.log` em server, em/en dashes, emojis).

---

## 5. Riscos e bloqueadores ativos

| Risco | Estado |
|---|---|---|
| **Nome**: **[ok] VibeCraft** (decisão do dono). **Chain final** ainda em aberto | nome travado; chain não bloqueia dev (Solana para MVP) |
| **Crafting/quests/energy/farming/shop/chests/status-effects/land** - registrados via `theme/plugins/server-plugin.js`; falta validar fluxo no jogo + UI | validar gameplay |
| **HTTP routes blockchain sem bearer-token** - `accountId` client-asserted; exigir middleware de auth antes de produção | aberto (segurança) |
| **Migrations**: `blocked_ips` + colunas TOTP aplicadas (bug de FK corrigido no SQL) | [ok] aplicado |
| Teste geral (`npm test`) ainda não rodado após port | próximo gate |
| Assets CC0 (paper-doll, ~600 itens) + seleção via editor `/editor` | planejado |
| Skills de profissão (farming, cooking, woodcutting, mining, fishing) - `skills_groups` vazio | não bloqueia MVP (crafting/farming não dependem) |
