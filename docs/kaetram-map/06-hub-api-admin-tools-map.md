# 06 — Hub, API, Admin e Pipeline de Mapas

## Hub (`packages/hub`)

Raiz: `F:\Kaetram-Open\packages\hub\src`

```
hub/src/
├── main.ts                # entrada
├── console.ts             # CLI (/server, /player)
├── controllers/
│   ├── api.ts             # API Express
│   ├── cache.ts           # aggregations de leaderboard (MongoDB, TTL)
│   ├── mailer.ts          # nodemailer
│   └── models.ts          # registry de modelos, dispatch de handshake, lookup de servidores
├── model/
│   ├── index.ts           # base Model (abstract)
│   ├── server.ts          # modelo por game server conectado
│   └── admin.ts           # client WS do admin
└── network/
    ├── handler.ts         # servidor uWS
    └── connection.ts      # wrapper de conexão
```

### Papel: gateway entre servidores

- Transporte uWS (`hubWsPort`), compression `DEDICATED_COMPRESSOR_3KB`, pub/sub (não REST).
- **Registro de game server**: conecta → recebe instance id aleatório → envia `Handshake{type:'hub', serverId, name, host, port, players, maxPlayers, gver}`; mismatch de versão → close.
- **Clientes NÃO falam com hub via WS.** Cliente chama `GET /server` (REST) → recebe host/port do servidor com vaga.
- **Cross-server messaging** (por packet relay):
  - `Chat` → private message: `findPlayer` em todos os servidores, forward; offline → notFound; sem alvo → Discord.
  - `Player` Login/Logout → adiciona/remove do registry, broadcast para todos os servidores, callback Discord.
  - `Guild` Update → resolve membros inativos para servidores online.
  - `Friends` → resolve amigos online com serverId → `FriendsPacket(Sync)`.
  - `Relay` → forward de packet genérico (guild join/leave).
- **Admins**: handshake `type:'admin'` com `accessToken`; recebem broadcasts da lista de servidores.
- `models.ts`: `models[instance]`, `findPlayer`, `findEmptyServer`, `hasSpace`, `broadcastServers/broadcastAdmins`, `syncAdmins`.

### API Express (`controllers/api.ts`)

Porta `hubPort`, CORS + JSON. Rotas:

| Método | Rota | Função |
|---|---|---|
| GET | `/` | status |
| GET | `/server` | servidor com vaga (seleção de mundo) |
| GET | `/all` | todos os servidores serializados |
| GET | `/leaderboards` | `?skill=` / `?mob=` / `?pvp` / total exp |
| POST | `/isOnline` | player online em outro servidor (token) |
| POST | `/api/v1/requestReset` | cria token + envia email |
| POST | `/api/v1/resetPassword` | `{id, token, password}` |
| POST | `/{stripeEndpoint}` | webhook Stripe (raw body, `payment_intent.succeeded`) |

Serviços do hub: MongoDB (leaderboards com cache TTL, fatal se falhar), Discord bot (status up/down, login/logout, tópico de população, relay de chat), Mailer (nodemailer SMTP).

## Admin (`packages/admin`)

- Astro, **página única**: `pages/index.astro` renderiza `<ul id="server-list">`; `src/main.ts` (browser) abre WS para o hub, envia `Handshake{type:'admin', accessToken}`, renderiza cada `SerializedServer` (nome, id, players/max, host:port).
- `middleware/index.ts`: allowlist de IP (só localhost) → 403 caso contrário. Layout com `noindex`.

## Tools — pipeline de mapas (`packages/tools`)

```
tools/
└── map/
    ├── data/               # map_template.json (~2.9MB, template mínimo), mobset.png, README
    └── parser/
        ├── parser.ts       # ProcessMap
        ├── exporter.ts     # escreve world.json + map.json + copia tilesets
        ├── replacer.ts     # find/replace de tiles
        ├── replace.json
        └── mapdata.d.ts    # tipos do JSON do Tiled
```

- **Entrada**: JSON do **Tiled** (não .tmx). Layers tilelayer (data base64, compressão zlib/gzip) ou objectgroup.
- **Fluxo `parser.ts`**:
  - `parseTilesets()`: firstGid/lastGid/path; tileset de entidades excluído da renderização.
  - `parseLayers()`: decompress → merge de layers em `data[]` único (arrays = tiles empilhados); objectgroup → áreas.
  - Layers especiais por nome: `entities` (tileId → chave de entidade), `plateau<N>` (z), `trees/rocks/foraging` (visual only).
  - Props de tile: `c/o` → collisions, `v` → high, `h/obs` → obstructing (splice de tiles escondidos), `cursor` → cursors.
  - Object layers → `areas[name]` com pos/size em tiles + polygon points + props.
- **Saídas**: server `data/map/world.json` (`version,width,height,tileSize,data,collisions,areas,plateau,high,objects,cursors,entities`) + client `data/maps/map.json` (meta: `width,height,tileSize,version,high,tilesets,animations`). Tilesets copiados para `client/public/img/tilesets/`.
- **Replacer**: troca tileId→newTileId via `replace.json`, backup automático — troca em massa de gráfico de tiles sem edição manual.
- **Importante**: o parser **não exporta luzes** (lights não são parseadas do Tiled) e o repo não envia o **mapa-fonte do Tiled** — `tools/map/data/` só tem `map_template.json` (template mínimo de 2,9 MB, anti-cópia). Porém o **mapa processado É enviado**: `server/data/map/world.json` (4,1 MB) já vem no repo, pronto para o servidor. Para nós: faremos nosso mapa do zero, sem tocar em nenhum dos dois.

## E2E (`packages/e2e`)

- Cypress + cucumber (`cypress/e2e/*.feature`), `start-server-and-test` sobe jogo (9000/9001) + mock de DB; testes de login/inventário. Para nós: Playwright + Vitest.

## Padrões a replicar

1. **Hub como pub/sub de servidores** — escalar horizontal com N servidores e 1 ponto de entrada para o cliente.
2. **Registro de servidor por handshake + version gate** — servidor antigo não entra no cluster.
3. **Leaderboards via aggregations + cache TTL** no hub, não no game server.
4. **Admin = consumidor passivo de broadcast** com token + allowlist.
5. **Pipeline de mapa em pacote separado** — Tiled JSON → world.json (server) + map.json (client), sem edição manual pós-export.
6. **Anti-cópia de mapa**: mapa real nunca commitado, só ferramentas + template.
