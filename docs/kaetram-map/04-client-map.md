# 04 — Mapa do Client (`packages/client`)

Raiz: `F:\Kaetram-Open\packages\client`

## Árvore resumida

```
packages/client/
├── astro.config.ts          # Astro + Vite + PWA + i18n + SEO
├── components/
│   ├── game.astro           # TODO o DOM estático da UI do jogo (~950 linhas: canvases, menus, chat, HUD)
│   └── intro.astro          # telas de login/registro/seleção de mundo
├── layouts/default.astro    # shell HTML: meta/OG/Twitter/JSON-LD, GA via partytown
├── middleware/index.ts      # astro-i18n-aut
├── pages/
│   ├── index.astro          # entrada: importa scss + main.ts, renderiza Intro + Game
│   ├── privacy.astro, reset.astro, unavailable.astro
├── data/
│   ├── maps/map.json        # meta do mapa: 1152x1008, tileSize 16, high-tiles, 4 tilesets, animações
│   └── sprites.json         # manifesto de sprites (~205KB): id, tamanho, offsetX
├── scss/                    # abstracts/ app/ base/ game/ (40+ arquivos)
├── public/
│   ├── audio/music/*.mp3 (18), audio/sounds/*.mp3 (28)
│   ├── fonts/ (9 TTF/WOFF)
│   ├── img/interface/       # sheets de UI (containers, botões, slots, guilds)
│   ├── img/sprites/         # player/{helmet,chestplate,weapon,legplates,shield,skin,cape}/,
│   │                        # mobs/, npcs/, items/ (~500), objects/, projectiles/, rocks/,
│   │                        # trees/, effects/, bushes/, fishspots/, cursors/, crowns/, pets/, skills/
│   ├── img/tilesets/tilesheet-1..6.png
│   └── img/overlays/fog.png, img/flags/, img/icons/ (PWA)
└── src/
    ├── main.ts              # entrada: new Game(new App()) on load
    ├── app.ts               # lógica DOM de menu/login/registro, hub world list
    ├── game.ts              # orquestrador: instancia todos os controllers, tick loop
    ├── controllers/         # audio, bubble, chat, entities, hud, info, input, joystick, menu, pointer, sprites, zoning
    ├── entity/              # entity, sprite, animation, character/{player,mob,pet}, npc,
    │                        # objects/{chest,item,effect,projectile,resource/{tree,rock,fishspot,foraging}}
    ├── lib/                 # astar, i18n, log, pwa, sentry
    ├── map/                 # map, grids, tile
    ├── menu/                # 25 classes de menu (inventory, bank, trade, guilds, store, crafting, enchant, quests...)
    ├── network/             # connection, messages, socket
    ├── renderer/            # camera, canvas (2d), webgl/, shaders/, overlays, updater, minigame, bubbles/, infos/, pointers/
    ├── reset.ts
    └── utils/               # detect, pathfinder, press, storage, timer, tooltip, transition, util
```

## 1. Estrutura Web (Astro)

- Rotas: `/` (SPA do jogo), `/privacy`, `/reset`, `/unavailable`. Só `index.astro` carrega o jogo.
- `components/game.astro`: DOM estático — **8 canvases empilhados**: `#background, #entities, #entities-fore, #foreground, #entities-mask, #cursor, #overlay, #text-canvas`. Toda UI (inventário, banco, trade, guilds, settings, chat, joystick, zoom, quickslots) é HTML/CSS posicionado sobre os canvases — **não** desenhada em canvas.
- i18n: `astro-i18n-aut` + i18next; 8 idiomas (en/de/es/fr/pt/ro/ru/tl), 9 namespaces.
- PWA: `vite-plugin-pwa` autoUpdate, service worker, manifest (só prod), prompt de install no login.
- SEO: sitemap i18n, robots-txt, JSON-LD VideoGame, Sentry (browser + vite plugin).

## 2. Engine (src/)

- **Renderer duplo**: base `Renderer`; `canvas.ts` (2D, default) e `webgl/` (WebGL1, opcional via setting, off default). WebGL só renderiza tilemap (quad único + layer textures `Uint8Array` codificando tileId/flags); entidades/texto/cursor/overlay sempre 2D. Shaders GLSL ES 1.0 (`shaders/layer.vert/.frag`) via vite-plugin-glsl.
- **Camera**: segue player com suavização por pixel, zoom 0.6–6+ (minZoom 2.6 desktop), zona de quadrantes (low-power mode descentraliza camera), clipping + `forEachVisiblePosition`.
- **Mapa**: `data/maps/map.json` = só meta (dimensões, tilesets, animações). Tiles reais vêm do servidor por regiões (comprimidos, pako inflate) e são cacheados em **IndexedDB** (stores: regions, objects, cursorTiles), versão-invalidados. Grid de colisão montado no client.
- **Sprites**: manifesto `data/sprites.json`; caminho derivado do id (`public/img/sprites/{id}.png`); animações por linhas; variantes hurt/silhouette geradas.
- **Animações**: entity/animation.ts (estado de frames/rows) + map/tile.ts (tiles animados).
- **Iluminação**: lib `illuminated` (DarkMask/Lamp/Lighting) sobre canvas overlay; luzes por entidade + estáticas + player (inner/outer), flicker, composite 'lighter'. Overlays (fog) acionados por packet do servidor.
- **Áudio**: Web Audio API; AudioContext criado na 1ª interação (login); buffers cacheados; crossfade de música 3s via GainNode; volume por distância.
- **Input**: teclado (WASD/setas), click-to-move com célula alvo, menu de contexto (botão direito), cursor contextual por tile/entidade, hover detection. Joystick DOM para mobile.
- **UI**: MenuController agrega 25 classes de menu; DOM estático vem do game.astro; menus só preenchem/posicionam. `synchronize()` atualiza menus abertos após packets.
- **Minigames**: renderer/minigame.ts — state machine (TeamWar countdown + placar; Coursing placar por player) desenhada no text canvas.
- **Mobile**: joystick, botões de zoom, low-power mode (camera descentralizada + sem animação de tiles), throttle 50/30 FPS.

## 3. Rede (src/network/)

- **Transporte**: `socket.ts` — **WebSocket nativo** (socket.io-client declarado mas não usado). Hub mode: `fetch({hub}/server)` para escolher mundo. Close code custom **1010** carrega motivo de rejeição (UTF8).
- **Wire format**: array JSON `[packetId, data]`; batch = array de arrays. `receive()` → `handleData`/`handleBulkData`.
- **Registry**: `messages.ts` — array indexado pelo enum `Packets` (~60 tipos), cada posição mapeia callback tipado; registro via `on{Nome}()`. Implementação dos handlers em `connection.ts` (~1600 linhas).
- **Fluxo**: login → handshake (gVer) → reply (tipo, serverTime p/ offset, instance, serverId) → Login opcode (Guest/Register/Login) → Welcome (dados completos) → Ready → Map packets por região (pako inflate) → entity List/Spawn/Who.
- **Sync de estado**: diff de ids conhecidos vs servidor → fila `decrepit` (despawn) + request `Who`; teleporte em mismatch de grid; Ping/Pong + offset de tempo.
- **Interpolação**: classe `Transition` (utils/transition.ts) para movimento e fades — desacoplada do tick rate.

## 4. Entidades client-side (src/entity/)

- Fábrica por `EntityType` (Player/Mob/NPC/Item/Chest/Projectile/Effect/Pet/Tree/Rock/FishSpot/Foraging).
- `controllers/entities.ts`: dicionário por instance, grid espacial `renderingGrid[y][x]` para lookup O(1), fila `decrepit`, `entityUpdateQueue` para info atrasada.
- Desenho: blit com flip, zoom, rotação (projéteis), sombra sob entidade, alpha fade-in. Árvores: copa em `entities-fore` (acima do player), tronco em `entities` (destination-over).
- **Paper-doll**: equipamento desenhado em camadas sobre skin base, frame-sincronizado com a linha de animação.
- Name tags, níveis (cores de rank, crowns), health bars, damage popups (`Splat` flutuante com fade), cursores de contexto, sparkles, silhouettes, efeitos (poison ball, critical, freezing).

## 5. Estado client-server

- `game.ts` = agregador raiz (player, map, camera, zoning, overlays, pathfinder, info, sprites, minigame, renderer, input, socket, pointer, updater, audio, entities, bubble, joystick, menu, connection).
- A* **só no client** (lib/astar.ts + utils/pathfinder.ts); servidor valida steps.
- Preferências em localStorage; cache de regiões em IndexedDB (chave = versão).

## 6. Padrões a replicar

1. **8 canvases por preocupação** (tiles fundo/frente, entidades, máscara, cursor, iluminação, texto) — permite híbrido WebGL tiles + 2D entidades.
2. **Region streaming autoritativo**: client não possui dados de mapa, só meta; tiles chegam por região, comprimidos, cacheados com invalidação por versão.
3. **Packet enum + registry de callbacks** com tipos compartilhados (`@kaetram/common`) — fonte única do wire format.
4. **Fábrica de entidades + grid espacial** — O(1) lookup e busca de vizinhos; despawn por diff.
5. **Renderer duplo atrás de base comum** (`ContextType = '2d' | 'webgl'`).
6. **UI em DOM, mundo em canvas** — menus HTML/CSS, canvas só para entidades/texto.
7. **Config injetada em build** (Vite `define` → `globalConfig`) — sem fetch de config no runtime.
8. **Interpolação via Transition** — desacoplada de FPS/tick.
9. **Tiers de performance** — low-power/mobile com feature flags (camera, animação, FPS).
