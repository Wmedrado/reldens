# 07 — Mapa de Assets: Kaetram → CC0

## Inventário do Kaetram (proibido para nós)

Local: `F:\Kaetram-Open\packages\client\public\` — licença **CC-BY-SA 3.0** (herança BrowserQuest) + **OPL** (proíbe NFT/cripto). Servem apenas como **referência de catálogo**: que tipo de asset existe e quantos, para sabermos o que precisamos produzir/obter.

| Categoria | Caminho | Quantidade | Tamanho |
|---|---|---|---|
| Sprites de itens | `img/sprites/items/` | 617 arquivos | — |
| Sprites de mobs | `img/sprites/mobs/` | 166 | — |
| Sprites de NPCs | `img/sprites/npcs/` | 77 | — |
| Sprites de player | `img/sprites/player/` (helmet, chestplate, weapon, legplates, shield, skin, cape) | 269 | — |
| Efeitos | `img/sprites/effects/` | 31 | — |
| Projéteis | `img/sprites/projectiles/` | 33 | — |
| Árvores | `img/sprites/trees/` | 27 | — |
| Rochas | `img/sprites/rocks/` | 20 | — |
| Skills | `img/sprites/skills/` | 20 | — |
| Cursores | `img/sprites/cursors/` | 14 | — |
| Outros | bushes, crowns, fishspots, objects, pets | ~30 | — |
| **Total sprites** | `img/sprites/` | **1.316** | 2,2 MB |
| Tilesets | `img/tilesets/tilesheet-1..6.png` | 6 sheets | 1,1 MB |
| Interface | `img/interface/` | 90 | 0,1 MB |
| Música | `audio/music/` | 18 MP3 | 15,4 MB |
| Sons | `audio/sounds/` | 26 MP3 | 0,3 MB |
| Fontes | `fonts/` | 10 TTF/WOFF | 0,2 MB |
| Overlays | `img/overlays/fog.png` | 1 | 0,1 MB |
| Flags, icons PWA | `img/flags/`, `img/icons/` | 11 | — |
| Manifesto | `data/sprites.json` (~205KB) + `data/maps/map.json` | — | — |

**Escala do trabalho**: ~1.300 sprites 16x16, 6 tilesheets, 44 arquivos de áudio, UI completa. Dados de conteúdo (`server/data/*.json`) também são originais deles — nosso balanceamento será próprio.

## Regras de licença para nosso jogo (Web3/NFT)

- **Aceitável**: CC0 / Public Domain (ideal), MIT/Apache (código), SIL OFL (fontes), CC-BY (com atribuição — aceitável mas preferir CC0), assets próprios/comissionados.
- **Proibido**: CC-BY-SA, CC-BY-NC, CC-BY-ND, GPL (assets), qualquer coisa do Kaetram/BrowserQuest.
- Atenção a packs "inspirados em 0x72": verificar licença de cada um (extensões de terceiros podem ser CC-BY).

## Tabela de equivalentes CC0

Fontes verificadas nesta sessão: **Kenney (CC0)** ✓, **0x72 DungeonTileset II (CC0)** ✓. FreePD.com fechou em 2025 — usar alternativas.

| Necessidade | Kaetram usa | Substituto CC0 | Nota |
|---|---|---|---|
| Tileset 16x16 dungeon | tilesheet-1..6 | [Kenney — Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) (130 arquivos, 16x16) | CC0 verificado |
| Tileset 16x16 dungeon (alternativo) | — | [0x72 — 16x16 DungeonTileset II](https://0x72.itch.io/dungeontileset-ii) + extensões (superdark enchanted forest, safwyl autotile...) | CC0 verificado; extensões: verificar 1 a 1 |
| Tileset cidade/overworld | — | [Kenney — Tiny Town](https://kenney.nl/assets/tiny-town), Tiny Battle, 1-Bit Pack, Micro Roguelike | Todos CC0 |
| Personagens 16x16 (player) | player/* (269) | Kenney Tiny Dungeon (heróis), [0x72 personagens](https://0x72.itch.io/16x16-dungeon-tileset), KingBell [Pixel Sprite Mixer](https://kingbell.itch.io/pixel-sprite-mixer) (gerador, base 0x72) | Mixer gera variações custom |
| Paper-doll (equipamento em camadas) | helmet/chestplate/weapon/shield/cape | Comissionar do zero OU construir sobre base CC0 16x16 | Não existe pack CC0 equivalente pronto — ponto de investimento |
| Mobs 16x16 | mobs/* (166) | 0x72 DungeonTileset II (orcs, undead, demons, lizard), Kenney Tiny Battle/Tiny Dungeon | Verificar quantidade por pack |
| NPCs | npcs/* (77) | superdark [16x16 Free NPC Pack](https://superdark.itch.io/16x16-free-npc-pack) (extensão 0x72) | Confirmar licença na página |
| Itens/ícones | items/* (617) | Kenney — Game Icons, Pixel Shmup, Roguelike/RPG Pack (UI+itens); 0x72 itens | Volume 600+ exige combinação de packs + produção própria |
| UI/interface | interface/* (90) | Kenney — UI Pack, Kenney — Fantasy UI Borders | CC0 |
| Efeitos | effects/* (31) | Kenney — Particle Pack, Pixel Art Effect Pack | CC0 |
| Cursores | cursors/* (14) | Kenney — Cursor Pack | CC0 |
| Árvores/rochas/recursos | trees/, rocks/ | Kenney Tiny Dungeon/Tiny Town (nature), 0x72 (props) | CC0 |
| Música de fundo | music/* (18) | [Juhani Junkala — Subspace Audio (OGA)](https://opengameart.org/users/subspaceaudio) (CC0), Kenney — Music Jingles (CC0), [OGA filtro CC0](https://opengameart.org/art-search-advanced?field_art_licenses[]=14885) | FreePD fechou; OGA tem busca por licença CC0 |
| Sons/SFX | sounds/* (26) | Juhani Junkala — 512 Sound Effects (OGA, CC0), Kenney — Digital Audio/RPG Audio/Interface Sounds (CC0) | |
| Fontes | fonts/* (9) | Fontes SIL OFL (Google Fonts): Press Start 2P, Pixelify Sans, VT323, IBM Plex... | OFL é permissiva para jogos/NFT |
| Fog/overlays | overlays/fog.png | Gerar procedural (canvas) ou criar próprio | Trivial |

## Recursos de busca (filtrar SEMPRE por CC0)

- **itch.io** — filtro "Asset license: Creative Commons Zero": https://itch.io/game-assets/free
- **OpenGameArt** — busca avançada licença CC0/Public Domain: https://opengameart.org/art-search-advanced (marcar CC0)
- **Kenney.nl** — tudo CC0: https://kenney.nl/assets
- **Lost Garden** (Daniel Cook) — alguns packs antigos CC-BY (verificar)
- **Comissão própria** — para identidade visual única + paper-doll: maior controle e zero risco.

## Processo de auditoria de assets (obrigatório)

1. Todo asset externo entra com registro: nome, autor, URL, licença, data do download, hash do arquivo.
2. Manter screenshot/PDF da página de licença no momento do download (prova).
3. Prioridade: CC0 > OFL/CC-BY > comissão própria > nunca SA/NC/ND.
4. Antes de cada release: rodar lista de registros e conferir que nenhum asset Kaetram entrou no repo.
5. Banco de itens NFT: metadata on-chain/off-chain deve referenciar somente assets CC0/próprios (imagens IPFS de assets CC0 são OK; atribuição não é obrigatória mas é cortesia).

## Ordem de produção sugerida

1. Tileset base (Kenney Tiny Dungeon + Tiny Town) — desbloqueia mapa e colisão.
2. Player + paper-doll (comissionar — é o asset mais importante para NFT).
3. Mobs/NPCs (0x72 + superdark + produção).
4. Itens (Kenney + produção própria por tier/rarity).
5. UI, sons, música (Kenney + Juhani Junkala).
6. Mapa próprio no Tiled (nunca o template do Kaetram).
