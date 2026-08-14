# 02 — Mecânicas e Economia (Pixels.xyz → nossos sistemas)

> Camada de produto/design. Mapeia cada mecânica do Pixels.xyz para o sistema
> correspondente do nosso stack (Reldens + módulos portados + novos módulos).
> **Regra**: comportamento autoritativo no servidor; cliente só exibe.

---

## 1. Visão do core loop

```
[Guest/Wallet login] → [Terra/Plot] → [Plantar] → (timer) → [Colher]
        ↑                                                   ↓
   [Upgrades/Compra] ← [Moeda soft/token] ← [Vender] ← [Craftar/Cozinhar]
        ↓
   [Quests] → [Energia] → [Skills sobem] → [Desbloqueia receitas/terra/tier]
```

- **Energia** é o recurso central que limita todas as ações produtivas.
- **Moeda soft** (in-game) e **token** (on-chain) são as duas saídas de valor.
- **NFTs** (terra, itens, pets) são os ativos que saem do jogo (transferível).

---

## 2. Farming (fazenda)

| Aspecto | Pixels.xyz | Nosso design |
|---|---|---|
| Terra | Land NFT (tiers) | Land NFT (mint/verify via `lib/blockchain`); plots free para guest, premium exige NFT. |
| Plantio | Seed item → plot | Item `seed` do `@reldens/items-system`, plot = entidade no mapa (room). |
| Crescimento | Timer real (min→h) | Timer server-side por instância de crop; estado salvo (persistência). |
| Colheita | Yield + xp | Yield definido por crop; xp de skill `farming`. |
| Sazonalidade/clima | Afeta yield | Fase futura (evento global). |

**Dependências de código**: crop como objeto/entidade com timer (novo módulo
`lib/farming/`), integrado a `@reldens/skills` (farming skill) e `@reldens/items-system`
(seeds/produtos).

---

## 3. Energia

| Aspecto | Pixels.xyz | Nosso design |
|---|---|---|
| Recurso | Energia por ação | Stat `energy` (persistente) + cap máx. |
| Consumo | Plantar, colher, craftar, coletar | Config por ação (constantes/data). |
| Regeneração | 1 a cada N min | Timer server-side (regen por tick); boost VIP aumenta taxa. |
| Cap | Sobe com level/VIP | `maxEnergy = base + level * k + VIP_bonus`. |

**Dependências**: novo módulo `lib/energy/` (ou stat do `@reldens/modifiers`) +
hook de custo em cada ação produtiva. **Status: 🔴 pendente** (ver `04-roadmap.md`).

---

## 4. Crafting & Cooking

| Aspecto | Pixels.xyz | Nosso design |
|---|---|---|
| Receitas | Lista por skill | Tabela `crafting_recipes` + `crafting_recipes_items` (migration `beta.40-crafting-tables.sql` já criada). |
| Requisitos | Itens + nível | `requirements` (item + count) + `skill_level`. |
| Produção | Consome input → output | Server consome inputs, valida, entrega output, dá exp de skill. |
| Exp | Por craft | `experience` por receita. |
| Falha | RNG/duração | Sem falha (determinístico) na v1; duração opcional depois. |

**Dependências**: `lib/crafting/server/plugin.js` (ações list/start/craft) +
UI cliente (janela de receitas). **Status: 🟡 tabelas prontas, plugin/UI pendente**.

---

## 5. Quests / Tasks

| Aspecto | Pixels.xyz | Nosso design |
|---|---|---|
| Task board | Diárias + one-time | NPC/board com lista de quests. |
| Tipos | Farmar X, craftar Y, coletar Z, visitar | Máquina de estágios (referência Kaetram §quests, reimplementada): `talk`, `kill`, `collect`, `door`, `resource`, `timer`. |
| Progresso | Por player | Tabela `quests` + `quest_progress`. |
| Recompensa | Token/items/xp | `rewards` (moeda soft, itens, xp, NFT em casos raros). |

**Dependências**: novo módulo `lib/quests/` + UI task board. **Status: 🔴 pendente**.

---

## 6. Skills (já suportado pelo Reldens)

Reldens tem `@reldens/skills` nativo. Mapeamos as skills do Pixels:

| Pixels skill | Skill Reldens | Nota |
|---|---|---|
| Farming | `farming` (nova) | ligada ao módulo farming |
| Cooking | `cooking` (nova) | ligada ao crafting |
| Woodcutting | `woodcutting` (nova) | recurso árvore (objeto) |
| Mining | `mining` (nova) | recurso rocha (objeto) |
| Fishing | `fishing` (nova) | recurso água |
| Beekeeping / Husbandry | fase futura | — |
| Combate (HP/ATK/DEF) | stats nativos + `@reldens/modifiers` | já pronto |

Cada skill usa o padrão de XP por ação (drops/exp server-side).

---

## 7. Shop NPC (compra/venda)

| Aspecto | Pixels.xyz | Nosso design |
|---|---|---|
| Vender | Item → moeda soft | NPC `store` com tabela de preços (data). |
| Comprar | Moeda soft → item | Mesmo NPC, catálogo. |
| Preço | Estático/dinâmico | Estático na v1; dinâmico depois (sink de token). |

**Dependências**: novo módulo ou objeto NPC + catálogo JSON. **Status: 🔴 pendente**.

---

## 8. Guilds / Social

Reldens tem **teams** nativo. Adaptamos para guilds: nome, chat, membros, ranks,
bônus compartilhado. Cross-server fica para fase futura (padrão hub do Kaetram).

---

## 9. Pets

Pets = NFTs que dão bônus (energy, xp, yield). Fase v2: NFT verify (já temos
`nft-verify.js`) + entidade pet seguindo o player + modifiers.

---

## 10. Economia (token + moeda soft)

### Modelo de duas moedas (como Pixels $PIXEL + $BERRY)

| Moeda | Natureza | Uso | On-chain? |
|---|---|---|---|
| **Moeda soft** (ex.: "Berry"/"Moedas") | in-game, fungível | Shop, craft tax, conveniência | Não (DB) |
| **Token de utilidade** | on-chain | Compra de terra, marketplace, VIP, recompensas | Sim |

**Decisão em aberto** (ver `00` §5): token único vs dual.

### Faucets (entradas) vs Sinks (saídas)

| Faucets | Sinks |
|---|---|
| Quests, drops, eventos, VIP rewards | Crafting (taxa/insumos), shop, terra premium, upgrade, energia acelerada |

**Princípio**: sinks ≥ faucets para evitar inflação. Drops de NFT com supply fixo
on-chain (não infinito).

### Raridade / drops

Usar chance granular (referência Kaetram: roll em 100.000) para raridades
comum→mítico. Para NFT, supply fixo no contrato + **pity system** (evita RNG puro —
ponto fraco do Kaetram identificado em `kaetram-map/10`).

---

## 11. Status effects (via skills/modifiers)

Efeitos de status (veneno, paralisia, buff) devem usar `@reldens/modifiers` +
`@reldens/skills`, **avaliando caso a caso** se já são cobertos ou se precisam de
novo código. **Status: 🟡 avaliar** — não duplicar o que o Reldens já faz.

---

## 12. Matriz de implementação (mecânica → módulo → status)

| Mecânica | Módulo | Base Reldens | Status |
|---|---|---|---|
| Wallet auth | `lib/blockchain` | plugin | ✅ |
| Token/NFT/Holder | `lib/blockchain` | plugin | ✅ |
| Chat/moderação | `lib/chat` + `lib/rooms` | nativo estendido | ✅ |
| Auth hardening | `lib/users` | nativo estendido | ✅ |
| Crafting | `lib/crafting` (novo) | items + skills | 🟡 |
| Quests | `lib/quests` (novo) | events | 🔴 |
| Energy | `lib/energy` (novo) | modifiers | 🔴 |
| Farming | `lib/farming` (novo) | objects + skills | 🔴 |
| Shop | `lib/` (novo) | objects + items | 🔴 |
| Skills | `@reldens/skills` | nativo | ✅ (novas skills a registrar) |
| Guilds | `teams` nativo | nativo | 🟡 adaptar |
| Pets | `lib/blockchain` + entities | nativo | 🔴 (v2) |
| Status effects | `@reldens/modifiers` | nativo | 🟡 avaliar |
