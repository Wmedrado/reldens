# 10 — Sistemas de Gameplay e Contratos de Conteúdo

Mapa profundo dos sistemas de jogo do Kaetram + formato dos dados de conteúdo (`packages/server/data/*.json`). Serve para a IA de design/balanceamento desenhar nossos equivalentes do zero, sem reescrever os deles.

**Regra**: os JSONs abaixo são referência de **schema** (que campos um item/mob/quest precisa ter). Nossos dados serão criados do zero com balanceamento próprio.

## 1. Contratos de dados (schemas)

### items.json — 525 itens (~232 KB)

```json
"coppersword": {
    "type": "weapon",
    "name": "Copper Sword",
    "weaponType": "sword",
    "attackStats":   { "crush": 2, "slash": 2, "stab": 2, "archery": 0, "magic": 0 },
    "defenseStats":  { "crush": 1, "slash": 2, "stab": 1, "archery": 0, "magic": 0 },
    "bonuses":       { "accuracy": 1, "strength": 1, "archery": 0, "magic": 0 }
}
```

- 5 estilos de ataque: `crush, slash, stab, archery, magic`. Toda arma/armadura define vetores de ataque e defesa nesses 5 eixos + bônus.
- Tipos de item incluem: `weapon, armour, pendant, ring, boots, potion, food, log, ore, fish, gem, quest, currency, etc.` (ver `types/item.d.ts`).
- Campos comuns por tipo: `stackable, edible, maxStack, healing, plugin, level requirement, light, description`.

### mobs.json — 148 mobs

```json
"rat": {
    "name": "Rat", "description": "...",
    "drops": [ { "key": "petrat", "chance": 5 } ],
    "dropTables": ["ordinary"],
    "hitPoints": 20, "level": 1,
    "aggroRange": 1, "attackRate": 1400, "movementSpeed": 450,
    "respawnDelay": 10000,
    "attackStats": {...}, "defenseStats": {...}, "bonuses": {...},
    "skills": { "accuracy": 2, "strength": 1, "defense": 0, "archery": 0, "magic": 0 }
}
```

- `chance` em **100.000** (roll `randomInt(0, 100000) < chance`). `petrat` com chance 5 = 0,005%.
- `dropTables` referencia chaves de `tables.json`.
- Mobs com `plugin` (campo opcional) trocam o handler por classe de IA custom (bosses).
- Outros campos possíveis: `miniboss, projectileName, achievement, roaming, hiddenName, armour` (via spawns).

### spawns.json — 22 spawn points

```json
"259-435": { "name": "Ancient Wizard", "roaming": true, "miniboss": true,
             "hitPoints": 250, "level": 10, "projectileName": "fireball2",
             "achievement": "ancientwizard" }
```

Chave = `x-y` do tile. Sobrescreve campos do mob base. Spawn points ficam no mapa (`entities` layer) ou neste JSON.

### tables.json — drop tables globais

```json
"ordinary": { "drops": [ { "key": "...", "chance": N } ] }
```

9 tabelas: `warriorcrab, ordinary, arrows, unusual, shards, vegetables, fruits, mushrooms, manafruits`. Mobs usam `dropTables` para herdar drops comuns + `drops` próprio.

### npcs.json

```json
"king": { "name": "King", "text": ["...", "..."], "role": "banker" }
```

`role` opcional: `banker, enchanter, clerk, store` (abre interface). `text` = diálogo sequencial.

### crafting/{smithing,crafting,alchemy,fletching,cooking,chiseling,smelting}.json

```json
"hilt2": { "level": 1, "experience": 20,
           "requirements": [ { "key": "tinbar", "count": 1 }, { "key": "logs", "count": 1 } ],
           "result": { "count": 1 } }
```

Chave = item resultante. `level` = nível de skill necessário. Crafting é multi-skill: cada arquivo liga a uma skill.

### abilities.json — 8 habilidades de personagem

```json
{ "name": "...", "description": "...", "level": N, "duration": N, "cooldown": N }
```

Impls: `run, hotshot, awareness, precognition, intimidate, thickskin, dualistsmark, secretcalling` (abstract `Ability` + `player/ability/impl/`).

### achievements.json — 82 conquistas

```json
"firstrock": { "name": "First Rock", "description": "Mine your first rock!" }
```

Desbloqueadas por eventos do jogo (minerar, matar mob, completar quest). Progresso salvo em `player_achievements`.

### quests.json (21 instâncias) + quest_bases.json (28 bases)

```json
{
    "name": "Welcome to Kaetram",
    "description": "texto|com quebras de página",
    "rewards": ["Knowledge of the game :)"],
    "stages": {
        "0": { "task": "talk", "npc": "coder", "text": ["..."], "completedText": ["..."],
               "pointer": { "type": 0, "x": 134, "y": ... } },
        "1": { "task": "collect", "itemRequirements": [ { "key": "moonwood", "count": 10 } ] }
    }
}
```

- **Tipos de tarefa** (stages): `talk` (NPC), `kill` (mob), `collect` (item requirements), `door` (atravessar porta), `resource` (skill em recurso), `timer`.
- Bases = defs reutilizáveis; instâncias = ativações por player. `skillRequirements` opcional por quest (ex.: fletching 30).
- `pointer` = seta indicadora no client (type/x/y).
- Progresso por player hidratado do DB (`player_quests`), callbacks em `player/quest/impl/*` (22 impls).

### trees.json / rocks.json / fishing.json / foraging.json

Recursos com: `level` de skill, `experience`, `respawnTime`, `states` (visual por depletion), `reqAchievement` (ex.: árvore bloqueada por conquista — ligado ao sistema de dynamic tiles).

### effectentities.json / stores.json / minigames.json

- `stores.json`: lojas NPC (itens vendidos, preços em ouro).
- `minigames.json`: definições de minigames ligadas a áreas do mapa.
- `effectentities.json`: entidades de efeito de área (ex.: fonte de mana).

### map/world.json (server) — 4,1 MB, JÁ VEM no repo

Mapa processado: `version, width (1152), height (1008), tileSize (16), data (tiles empilhados por coordenada), collisions, areas (por nome: pvp/music/chest/overlay...), plateau (níveis z), high (tiles 2.5D), objects, cursors, entities (tile→chave), doors`.

## 2. Combate (server-authoritative)

Fonte: `src/game/entity/character/combat/combat.ts` + `src/info/formulas.ts`.

- Loop de ataque por personagem: intervalo `attackRate / 4` (4 ataques por ciclo de attackRate ms).
- **Fórmula de dano** (conceitual, não transcrever):
  - `maxDamage = f(bônus de dano do estilo, nível de strength/archery/magic)`.
  - `accuracy` = nível de accuracy + bônus − peso de defesa do alvo; crítico reduz accuracy em 0,15.
  - Crítico = multiplicador de dano **1,5x**.
  - `damage = randomInt(0, maxDamage)` após passar accuracy.
  - `maxDamage *= target.getDamageReduction()` (absorção de armadura).
- **Estilos de ataque** (`AttackStyle`): accurate (accuracy), defensive (defense), aggressive (strength), archery, magic — cada um treina stats diferentes.
- **Hits/efeitos**: `poison` (tipo de veneno, dano por tick), `status` effects (paralisia, etc.) por intervals; `character/effect/{poison,status}.ts`.
- **Atribuição de loot**: tabela de dano (`attackers`) decide quem ganha drop/xp; XP por hit = constante `EXPERIENCE_PER_HIT` (2).
- **Projéteis**: `objects/projectile.ts` — archery/magic; mobs com `projectileName` (ex.: fireball2).
- **PVE**: mobs com `aggroRange`, `roamDistance`, chase via follow; boss AI em `data/plugins/mobs/*` (skeletonking, queenant, forestdragon, piratecaptain, ant, santa...).

## 3. Skills (18)

Lista completa: `mining, lumberjacking, fishing, foraging, cooking, smithing, crafting, fletching, alchemy, magic, health, accuracy, archery, strength, defense, eating, loitering`.

- **Combat skills**: treinadas por estilo de ataque (strength/accuracy/defense/archery/magic/health).
- **Resource skills**: mining, lumberjacking, fishing, foraging — abstract `ResourceSkill`; recurso no mapa tem `level` mínimo e `experience`; estado do recurso (depleção) muda tile dinâmico.
- **Production skills**: cooking, smithing, crafting, fletching, alchemy — usam `crafting/*.json`.
- **Misc**: eating (comida), loitering (tempo online).
- Loop de skill: tick de 1s por player. Máximo nível profissão 99, nível geral 120.
- XP table: `src/info/loader.ts` (tabela de exp por nível).

## 4. Equipamento e Enchant

- Slots: `weapon, helmet, chestplate, legplates, shield, cape, pendant, ring, boots` (`Modules.Equipment`).
- `player/equipments.ts` + `equipment/*` (12 impls) — validação de slot, swap, requerimento de nível.
- **Enchant** (`controllers/enchanter.ts`): usa shards (item), 9 tipos de enchant (`Modules.Enchantment`), upgrade no NPC enchanter.

## 5. Economia e números de referência

| Constante | Valor | Onde |
|---|---|---|
| MAX_LEVEL | 120 | `common/network/modules.ts` |
| MAX_PROFESSION_LEVEL | 99 | idem |
| INVENTORY_SIZE | 25 slots | idem |
| BANK_SIZE | 420 | idem |
| MAX_STACK | 9999 | idem |
| MAX_GUILD_MEMBERS | 50 | idem |
| EXPERIENCE_PER_HIT | 2 | idem |
| UPDATE_TIME (tick) | 300 ms | env |
| SAVE_INTERVAL | 60 s | env |
| MAX_PLAYERS | 200 por servidor | env |

- Trading player-to-player: `player/trade.ts` (request/add/remove/accept/close).
- Stores NPC: `stores.json` + `controllers/stores.ts`.
- Guilds: `controllers/guilds.ts` — ranks, banner, chat, sync cross-server via hub.
- Eventos globais: `controllers/events.ts` — double drop / 1.5x exp em fins de semana.

## 6. Minigames

- Abstract `Minigame` (lobby via área do mapa, countdown, tick) + `impl/{teamwar,coursing}.ts`.
- TeamWar: 2 times, placar; Coursing: placar individual.
- Entrada: área do mapa com `mObjectType: 'lobby'` ligada ao minigame.

## 7. O que replicamos / adaptamos

1. **Schema de stats em 5 eixos** (crush/slash/stab/archery/magic) — modelo direto para nossos itens NFT: stats on-chain metadata.
2. **Drop tables com chance em 100.000** — permite raridades granulares (comum→mítico); no nosso caso, drops NFT com supply definido em contrato.
3. **Quest = máquina de estágios** (talk/kill/collect/door/resource/timer) — reimplementar com nosso task system.
4. **Recursos com depleção dinâmica** — tiles mudam por estado; no Web3, recurso pode ser tokenizado (terra/árvore como NFT).
5. **Crafting multi-skill com requirements** — blueprint para receitas NFT (burn de itens → mint de item superior).
6. **Enchant por shards** — upgrade de NFTs (consumíveis on-chain).
7. **Content-as-data** — todo nosso conteúdo em JSON validado por schema (zod) antes do runtime.

## 8. Pontos fracos do Kaetram para não repetir

- `player.ts` com 2,7k linhas (god-class) — compor por feature.
- Formulas num único arquivo sem testes isolados aparentes — testar fórmulas (nossos testes de unidade).
- Sem A* server-side (TODO deles) — decidir cedo; server-side é mais seguro anti-cheat.
- Drops 100% RNG sem pity system — considerar pity para NFT raros.
