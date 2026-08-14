# 03 — Mapa do Server (`packages/server`)

Raiz: `F:\Kaetram-Open\packages\server`

## Árvore resumida

```
packages/server/
├── data/                     # TODO conteúdo do jogo (JSON) + plugins TS
│   ├── items.json, mobs.json, npcs.json, abilities.json, achievements.json
│   ├── trees.json, rocks.json, fishing.json, foraging.json, tables.json
│   ├── spawns.json, stores.json, minigames.json, effectentities.json
│   ├── map/world.json        # mapa processado (regiões, colisões, áreas)
│   ├── crafting/*.json       # alchemy/chiseling/cooking/crafting/fletching/smelting/smithing
│   ├── quests/*.json         # 21 instâncias de quest
│   ├── quest_bases/*.json    # 28 bases compartilhadas
│   └── plugins/{items,mobs}/ # plugins de comportamento + index.ts
└── src/
    ├── main.ts               # entrada
    ├── args.ts               # overrides CLI
    ├── console.ts            # comandos stdin (/server, /player)
    ├── network/              # api, client, connection, network, sockethandler, websocket, sockets/uws
    ├── info/                 # loader (tabela exp), formulas (fórmulas de combate)
    ├── controllers/          # commands, crafting, enchanter, entities, events, guilds, incoming, stores, warps
    └── game/
        ├── world.ts          # raiz de composição (tudo instanciado aqui)
        ├── map/              # map, grids, region, regions, areas/
        ├── minigames/        # minigame, minigames, impl/{teamwar,coursing}
        ├── globals/          # globals, lights, signs, impl/{light,sign}
        └── entity/
            ├── entity.ts
            ├── npc/npc.ts
            ├── objects/      # item, chest, lootbag, projectile, effect, resource/
            └── character/    # character, combat/, points/, effect/
                ├── mob/      # mob, handler
                ├── pet/pet.ts
                └── player/   # player (2.7k linhas), handler, incoming, skills, quests,
                              # abilities, achievements, equipment/, containers/, quest/, skill/,
                              # ability/, friends, statistics, trade, equipments
```

## 1. Entrada (`src/main.ts`)

1. `Args` — CLI: `--host --port --serverId --updateTime --maxPlayers`.
2. Gate de licença: `ACCEPT_LICENSE` (se false, servidor não sobe).
3. `SocketHandler` (uWS) → `Database` (MongoDB) → `Loader` (tabela de exp).
4. `database.onReady` → `new World(...)` + `new Console(world)`.
5. Conexão rejeitada se `disallowed`/`worldfull`; senão `Network.handleConnection` → `new Player`.
6. DB falha → retry 10s; `SKIP_DATABASE=true` → sobe sem DB (modo offline).
7. SIGINT → salva todos os players → sai.

## 2. Rede (`src/network/`)

Fluxo: `SocketHandler` → `UWS` (sockets/uws.ts) → `Connection` → fila do `Network` → `Incoming` por player.

- **uWS config**: `compression: DISABLED`, `idleTimeout: 15`, `maxPayloadLength: 32MB`, IP de proxy via header `cf-connecting-ip`.
- **Wire format**: ArrayBuffer → TextDecoder → `JSON.parse`. Mensagem = array JSON `[packetId, opcode?, data, bufferSize?]`. Sem binário.
- **Proteções**: rate-limit por segundo (`messageLimit`), filtro de duplicadas (100ms), máx 16 conexões por IP, gap mínimo de reconexão 5s.
- **Send batching**: `Network` enfileira pacotes serializados por player; flush 1x por tick (300ms). É o "heartbeat" do servidor.
- **Compressão**: só `MapPacket` usa gzip (zlib + base64, `Utils.compress`); client infla com pako.
- **Dispatch**: `Incoming` (player/incoming.ts, ~850 linhas) faz switch no enum `Packets` → handlers (`handleHandshake`, `handleLogin`, `handleMovement`, `handleChat`...). Fluxo: Handshake → Login/Register/Guest (sanitizer + filtro de profanidade) → `player.load()` → Welcome → Ready.

## 3. `World` (`src/game/world.ts`) — raiz de composição

Instancia: `Map, API, Stores, Warps, Globals, Entities, Network, Minigames, Guilds, Client(hub), Events, Enchanter, Crafting, Discord`.

Loops:
```ts
setInterval(() => { this.network.parse(); this.map.regions.parse(); }, config.updateTime); // 300ms
setInterval(() => this.save(), config.saveInterval); // 60s
```
`world.push(packetType, data)` = funil único de envio. `PacketType`: Broadcast / Player / Players / Region / Regions / RegionList.

## 4. Mapa, Regiões, Grids (`src/game/map/`)

- `map.ts`: carrega `data/map/world.json` (`version,width,height,tileSize,data,collisions,areas,plateau,objects,cursors,entities,doors`). Array 1D de tiles; `coordToIndex/indexToCoord`; flags de flip desmascarados; `isColliding(x,y,player?)` = bounds → áreas dinâmicas → recursos no grid → colisões estáticas.
- `regions.ts`: divide mapa em regiões de `MAP_DIVISION_SIZE=48` tiles. `Region` guarda dicionário de entidades, fila de joins, áreas dinâmicas, luzes. Entidade entra na sua região + 8 vizinhas. `regions.parse()` por tick envia spawns da fila. Cache de tiles em `./cache/regions.json` (keyed por versão).
- `grids.ts`: índice espacial 2D de entidades por tile — usado para AoE e colisão com recursos.

## 5. Sistema de Entidades (`src/game/entity/`)

```
Entity (abstract) — instance, key, x/y, region, type guards isX()
├── Character (abstract) — combate, hp, mana, poison/status, attackers/target
│   ├── Player — Incoming, Handler, Inventory, Bank, Equipments, Skills, Quests,
│   │            Abilities, Achievements, Statistics, Friends, Trade, Mana
│   ├── Mob — MobHandler ou plugin Handler; drops, respawn, roaming, aggro
│   └── Pet — Character mínimo vinculado a dono
├── NPC — texto, papel (banker/enchanter/clerk), store
└── Objects:
    ├── Item (stackable, edible, plugin, stats, light)
    ├── Chest (estático/respawn, mimic, callback de abertura)
    ├── LootBag, Projectile, Effect
    └── Resource (abstract) → Tree, Rock, FishSpot, Foraging
```

- **Instance id carrega o tipo**: `Utils.createInstance(EntityType.Player)` prefixa; `getEntityType(instance)` reverte — discriminação de tipo sem `instanceof`.
- **Registry**: `controllers/entities.ts` — dicionários por tipo, spawns a partir de `map.entities`, limpeza, `forEachPlayer/Character`.

## 5b. Áreas e Globals

- **Areas** (`src/game/map/areas/`): abstract `Area` + grupo `Areas`; impls: `chest` (área de chests), `camera`, `dynamic` (remap de tiles por requisito de quest), `minigame` (lobby), `music` (troca de música), `overlay` (fog/escuro), `pvp`, `index`. Carregadas de `map.areas` pelo `AreasIndex`.
- **Globals** (`src/game/globals/`): `lights.ts` (luzes do mapa), `signs.ts` (placas interagíveis), impls `light`/`sign`.
- **Mob plugins** (`data/plugins/mobs/`): boss AI — `skeletonking, queenant, forestdragon, piratecaptain, ant, santa` + `default.ts`; trocam o `MobHandler` inteiro.

## 6. Combate e Progressão

- `character/combat/combat.ts`: loop de intervalo por personagem (`attackRate/4`); `Hit` calcula dano via `info/formulas.ts`; atribuição de loot; AoE via grid; poison/status por intervals.
- **Pathfinding**: **não existe A* no servidor.** Mobs fazem roaming aleatório dentro de `roamDistance`; player é client-driven (movimento validado passo a passo no servidor); chase = loop de combate + `character.follow()`.
- **Movimento**: validação de colisão por passo, guarda anti-teleport, restrição de `plateauLevel` (z).
- **Skills**: abstract `Skill` + `ResourceSkill` + 18 impls (`mining, lumberjacking, fishing, foraging, cooking, smithing, crafting, fletching, alchemy, magic, health, accuracy, archery, strength, defense, eating, loitering`). `Skills` instancia 1 por player; loop 1s.
- **Quests**: abstract `Quest` + 22 impls em `player/quest/impl/`; estágios (talk/kill/door/resource/timer); progresso por player hidratado do DB.
- **Abilities**: abstract + 8 impls (`run, hotshot, awareness, precognition, intimidate, thickskin, dualistsmark, secretcalling`).
- **Enchanting**: `controllers/enchanter.ts` (shards, 9 tipos de enchant).
- **Trading**: `player/trade.ts` (request/add/remove/accept/close).
- **Guilds**: `controllers/guilds.ts` (~580 linhas) — create/join/leave/chat/rank/banner; sync cross-server via hub.
- **Minigames**: abstract `Minigame` (lobby, tick, countdown) + `teamwar`, `coursing`; ligados a áreas do mapa.
- **Crafting**: `controllers/crafting.ts` multi-skill a partir de `data/crafting/*.json`.
- **Events**: `controllers/events.ts` — double-drop/1.5x exp de fim de semana.

## 7. Banco de Dados (`@kaetram/common/database/`)

- Driver: MongoDB (sem ORM). Coleções: `player_info, player_equipment, player_inventory, player_bank, player_quests, player_achievements, player_skills, player_statistics, player_abilities, player_friends, player_regions, guilds`.
- `loader.ts`: leitura (uma coleção por subsistema); `creator.ts`: serialização + upsert; fluxo: login → load paralelo por subsistema → containers server-side → save periódico → re-serialize → upsert.
- `mongodb.ts`: leaderboards via aggregations (MobAggregate, PvpAggregate, SkillExperience).

## 8. API REST e Discord

- `src/network/api.ts`: Express na porta `apiPort` (9002). `GET /` → `{name, port, gameVersion, maxPlayers, playerCount}`. Sentry opcional.
- Discord: `@kaetram/common/api/discord.ts` — bot com intents de guild/messages; bridge bidirecional de chat (`messageCreate` no canal configurado → `world.globalMessage`).

## 9. Configuração

- `@kaetram/common/config.ts`: dotenv-extended com fallback `.env.defaults` + parse de tipos. Chaves-chave: `UPDATE_TIME=300`, `SAVE_INTERVAL=60000`, `MAX_PLAYERS=200`, `SKIP_DATABASE`, `REGION_CACHE`, `MESSAGE_LIMIT`, `HUB_ENABLED`, `ACCEPT_LICENSE`, `TUTORIAL_ENABLED`.

## 10. Padrões a replicar

1. Content-as-data + plugins (comportamento em classes, dados em JSON).
2. Fila de envio por player com flush em tick (batching).
3. Region streaming com fila de joins e cache por versão.
4. Instance-id tipado (prefixo de EntityType).
5. Handler separado da entidade (mob plugins trocam o handler inteiro).
6. Callbacks single-slot encadeados (`onHit/onDeath/onMovement`) em vez de event emitter.
7. Serialização por entidade (`serialize()`) espelhada no client.
8. Config singleton com tipos camelCase.
