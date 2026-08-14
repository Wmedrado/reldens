# 05 — Camada Compartilhada (`packages/common`)

Raiz: `F:\Kaetram-Open\packages\common` — **sem `src/`**, código na raiz do pacote. Tipos em `types/` (`.d.ts`).

## Árvore

```
packages/common/
├── config.ts              # carregamento de env + interface Config tipada
├── api/
│   ├── discord.ts         # bot Discord (bridge de chat)
│   └── minigame.ts        # enums Status/Team
├── database/
│   ├── database.ts        # factory (só mongo/mongodb)
│   └── mongodb/
│       ├── mongodb.ts     # wrapper do driver (conexão, checks, aggregations de leaderboard)
│       ├── creator.ts     # serialização + upsert (save)
│       └── loader.ts      # leitura por coleção (load)
├── i18n/
│   ├── index.ts           # i18next init + t()
│   ├── options.ts         # 8 locales x 9 namespaces
│   └── {de,en,es,fr,pt,ro,ru,tl}/
├── network/
│   ├── index.ts           # barrel: Modules, Opcodes, Packets
│   ├── modules.ts         # EntityType, Actions, Skills, Constants...
│   ├── opcodes.ts         # sub-opcodes por domínio
│   ├── packet.ts          # classe base Packet
│   ├── packets.ts         # enum Packets (~62 ids)
│   └── impl/              # 54 implementações de packet + index.ts
├── text/                  # profanity.json, updates.json, en/ (textos do servidor)
├── types/                 # .d.ts: entity, item, mob, map, slot, statistics, status,
│                          # leaderboards, network, messages/{hub,incoming,outgoing}...
└── util/
    ├── filter.ts          # filtro de profanidade
    ├── log.ts
    └── utils.ts           # singleton Utils (tudo compartilhado)
```

## 1. Protocolo de Rede (o coração do monorepo)

- **Wire format**: array JSON `[packetId, opcode?, data]`; `bufferSize` anexado só quando payload gzip (`Packet.serialize()`).
- **Duas camadas de opcode**: enum global `Packets` (0=Connected ... 61=Resource, +AdminSync) + sub-opcodes por domínio (`opcodes.ts`: Login, Movement, Combat, Container, Quest, Guild, Trade, Enchant, Minigame...).
- **Um arquivo por packet** em `network/impl/` — padrão: `XxxPacketData` (interface) + `XxxPacketCallback` (tipo) + `XxxPacket extends Packet`. Barrel em `impl/index.ts`.
- Grupos: sessão (connected/handshake/welcome/network/player/relay/sync), mapa (map/spawn/list/despawn/teleport/respawn/camera), movimento (movement/animation/pointer/bubble), combate (combat/heal/death/points/experience/poison/pvp/effect), chat (chat/command/notification/friends/rank/guild), itens (container/lootbag/blink), equipamento (equipment/enchant), progressão (quest/achievement/skill), crafting (crafting/resource), interfaces (npc/store/trade/interface/ability/countdown/minigame/update/music/overlay).

## 2. Enums e Constantes (`network/modules.ts`)

- `EntityType` (14 tipos: Player, NPC, Item, Mob, Chest, Projectile, Object, Pet, LootBag, Effect, Tree, Rock, Foraging, FishSpot), `PacketType`, `ContainerType`, `Orientation`, `Actions`, `AttackStyle`, `AudioTypes`, `PoisonTypes`, `Warps`, `Skills` + ordem, `Enchantment`, `Effects`, `Crowns`, `Ranks`, `NPCRole`, `GuildRank`, banners.
- `Constants`: MAX_STACK, MAX_LEVEL 120, INVENTORY_SIZE 25, BANK_SIZE 420, MAX_PROFESSION_LEVEL 99, HEAL_RATE, MAP_DIVISION_SIZE 48, MAX_CONNECTIONS 16, MAX_GUILD_MEMBERS 50, EXPERIENCE_PER_HIT 2, respawns de recursos/chests...
- `MinigameConstants`, `APIConstants`, `Defaults`, `ItemDefaults`, `MobDefaults`, `MapFlags`, `ResourceState`.

## 3. Banco (`database/`)

- `database.ts`: factory — só `'mongo'`/`'mongodb'`; senão log de erro e `database=null` (modo offline).
- `mongodb.ts`: URL de conexão montada de config (`mongodb[+srv]://user:pass@host:port/db`), timeouts 5s, `Loader`+`Creator` instanciados no connect, aggregations de leaderboard.
- Coleções: `player_info, player_equipment, player_inventory, player_bank, player_quests, player_achievements, player_skills, player_statistics, player_abilities, player_friends, player_regions, guilds`.
- Padrão: **Loader** (ler + parsear) vs **Creator** (serializar + upsert), uma coleção por subsistema. Callbacks (não promises) no código legado; bcrypt via `Utils.hash/compare`.

## 4. Config (`config.ts`)

- dotenv-extended: `.env` → fallback `.env.defaults` → merge `.env.{NODE_ENV}`; parse-variables; chaves camelCase; singleton default export.
- Grupos: servidor/rede (host, port, apiEnabled, apiPort, maxPlayers, updateTime, gver, regionCache, saveInterval, messageLimit, tutorialEnabled, overrideAuth), hub/admin (hubEnabled, hubHost/Port/WsPort, hubAccessToken, adminHost/Port, remote*), banco (database, skipDatabase, mongodb*), SMTP, Sentry, Stripe, Discord, `acceptLicense`, `debugging`.
- `exposedConfig(...keys)` = subconjunto seguro pro client (injetado via Vite define).

## 5. Utils (`util/utils.ts`)

Singleton com: `createInstance` (prefixo por EntityType), randoms, `positionOffset`, `validPacket`, `formatName`, `getChecksum` (sha256), `getDistance`, `getEntityType`, `hash/compare` (bcryptjs), `compress` (zlib gzip), `sanitizeNumber`, `isEmail`, `isValidUsername/Password`, `getBufferSize`, `getPositionFromString`, flags de evento (doubleLumberjacking...). `util/filter.ts`: filtro de profanidade com `text/profanity.json`.

## 6. i18n

- i18next, 8 locales (en, de, es, fr, pt, ro, ru, tl), 9 namespaces (`crafting, enchant, game, guilds, item, misc, resource, store, warps`). Init top-level await; exporta `t`, `changeLanguage`, `getLanguage`.

## 7. Padrões a replicar

1. **Protocolo como pacote compartilhado** — enum + classes de packet definidos 1x, usados por client/server/hub. Fonte única do wire format.
2. **Opcode em duas camadas** — id global + sub-opcode de domínio em tuple JSON.
3. **Tipos em `.d.ts`** separados da implementação — interfaces puras de dados.
4. **Loader/Creator split** no banco — leitura e escrita separadas, sem ORM.
5. **Config singleton tipada** com env parseado uma vez.
6. **Constants de gameplay centralizadas** em um só lugar (`modules.ts`), fora do banco.

## Para nosso jogo (Web3)

- Replicar: pacote `common` com protocolo, enums, types, config. É o alicerce do monorepo.
- Trocar: bcryptjs por argon2/bcrypt próprio + auth por wallet (ver `09-web3-adaptation-notes.md`).
- Adicionar: tipos de NFT/metadata compartilhados no `common` (item id ↔ tokenId, rarity, chain info).
