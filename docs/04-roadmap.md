# 04 — Roadmap e Estado Atual

> Plano por fases + status detalhado de cada item. Mantém o "o que falta" sempre
> visível para orquestrar as IAs. Atualizar a cada milestone.

---

## 1. Estado atual consolidado (2026-08-14)

### ✅ Concluído (port + hardening)

| Item | Artefatos | Testes |
|---|---|---|
| Wallet auth Solana (challenge + verify + link) | `lib/blockchain/server/{wallet-verify,wallet-link-manager,plugin}.js` | `test-blockchain-wallet-verify.js` |
| Token balance + holder tier | `lib/blockchain/server/{token-balance,holder-tier}.js` | `test-blockchain-token-balance.js`, `test-blockchain-holder-tier.js` |
| NFT verify (Token-2022) + ownership | `lib/blockchain/server/{nft-verify,ownership-verifier}.js` | — (unit a adicionar) |
| Rate limit / anti-abuso | `lib/blockchain/server/rate-limit.js` | — |
| Client wallet | `lib/blockchain/client/{plugin,wallet}.js` | — |
| Chat: profanity 2-tier | `lib/chat/server/profanity-filter.js` | `test-chat-filter.js` |
| Chat: comandos moderação | `lib/chat/server/{moderation-commands,moderation-service}.js` | `test-moderation-commands.js` |
| Chat: rate limit + backpressure | `lib/rooms/server/{msg-rate-limit,ws-backpressure}.js` | `test-msg-rate-limit.js` |
| Auth: scrypt / TOTP / throttle | `lib/users/server/{scrypt,totp,auth-throttle}.js` | `test-scrypt.js`, `test-totp.js`, `test-auth-throttle.js` |
| Regras IA (hooks + agents + CLAUDE.md) | `.claude/` | — |
| Migrations blockchain + crafting | `migrations/development/` | — |
| Docs de referência (Kaetram + CloudCraft) | `docs/` | — |

### 🟡 Em andamento

| Item | Próximo passo | Bloqueado por |
|---|---|---|
| Crafting | plugin server (`list/start/craft`, validação, consumo, exp) + UI | tabelas já criadas |
| Instalação + verificação geral | `npm install` + `npm test` completo | — |

### 🔴 Pendente (gameplay Pixels-like)

| Item | Dependência |
|---|---|
| Quests/Tasks (tabelas + plugin + UI) | nenhum (novo módulo) |
| Energy (stat + regen + VIP boost) | modifiers |
| Status effects (via skills/modifiers) | avaliação caso a caso |
| Shop NPC (compra/venda) | items + objetos |
| Farming (plots + timers) | items + skills + energy |
| Tilesets CC0 + mapas (0x72) | asset pipeline |

---

## 2. Fases do roadmap

### Fase 0 — Fundação (≈ concluída)
- [x] Port blockchain + chat + auth + hardening (CloudCraft → Reldens).
- [x] Regras IA (hooks/agents/CLAUDE.md).
- [x] Migrations base.
- [x] Docs de referência (Kaetram, CloudCraft, master plan).
- [ ] **`npm install` + rodar todos os testes + corrigir falhas.** ← PRÓXIMO GATE

### Fase 1 — MVP jogável (sem chain obrigatório)
- [ ] Tilesets CC0 (0x72 / Kenney) + 2 mapas (town + farm).
- [ ] Farming básico (plantar/colher + inventário).
- [ ] Crafting completo (plugin + UI).
- [ ] Quests simples (task board + claim).
- [ ] Energy (regen + custo).
- [ ] Shop NPC (moeda soft).
- [ ] Skills registradas (farming, cooking, woodcutting, mining, fishing).
- [ ] UI cliente para tudo acima.

### Fase 2 — Web3 / NFT (v1)
- [ ] Terras NFT (mint/verify) como gate de plots premium.
- [ ] Itens NFT (mint em craft/conquista, badge, burn).
- [ ] Token de utilidade + faucets/sinks.
- [ ] Marketplace / transfer de itens NFT.
- [ ] VIP (holding) com boost energia/xp/drops.

### Fase 3 — Social / Escala
- [ ] Guilds (adaptar `teams`).
- [ ] Pets NFT.
- [ ] Eventos sazonais / leaderboards (hub).
- [ ] Hub multi-servidor (padrão Kaetram).
- [ ] Cross-server chat/friends.

---

## 3. Ordem de execução recomendada (próximas tarefas das IAs)

1. **Fechar Fase 0**: `npm install` → `npm test` → corrigir falhas dos 13 testes novos.
2. **Crafting** (continuar do que já tem): plugin server → entities → plugin client/UI → testes.
3. **Energy** (desbloqueia farming): stat + regen + custo por ação.
4. **Farming**: plots + timers + colheita (usa energy + items + skills).
5. **Quests**: tabelas + plugin + UI (usa crafting/farming como objetivos).
6. **Shop NPC**: catálogo + compra/venda (usa moeda soft).
7. **Assets + mapas**: tilesets CC0 + mapas Tiled próprios (paralelo a tudo).
8. **Status effects**: avaliar cobertura do `@reldens/modifiers` antes de escrever código.

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
|---|---|
| Decisão de **nome** e **chain final** pendente (não bloqueia dev, mas trava branding/contratos) | aberto |
| **Crafting/quests/energy/farming** ainda sem código — principal esforço restante | em andamento |
| Teste geral (`npm test`) ainda não rodado após port | próximo gate |
| Assets CC0 (paper-doll, ~600 itens) — maior esforço de produção visual | planejado |
