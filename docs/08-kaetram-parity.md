# 08 - Matriz de Paridade: Kaetram-Open vs VibeCraft

> Checklist de validacao do objetivo: **"desenvolver o game end to end e validar
> absolutamente tudo contra F:\Kaetram-Open, testar e garantir que o jogo seja
> equivalente ou melhor."** (2026-08-14)
>
> Kaetram-Open v0.5.5 = **referencia conceitual apenas.** Regra de licenca:
> nada de codigo/asset do Kaetram (OPL proibe NFT/cripto) entra no produto;
> so padroes, CC0 ou asset proprio. Este doc mapeia FEATURES, nunca codigo.
>
> Legenda: DONE (feito+validado) | PARTIAL (existe, incompleto/nao validado) |
> GAP (falta) | N/A (fora de escopo do MVP).

## Estado da validacao (baseline 2026-08-14)

- Game server sobe limpo do working tree atual (PID 58408, `Server listening` 20:00:21,
  HTTP 200 em 8080/4300/4310). Sem erros de runtime pos-boot.
- Suite de testes puros: **48/48 PASS, 0 FAIL** (48 arquivos; 3 admin exigem servidor vivo).
- T2.3 + T2.4 + T2.5 + T2.6 entregues 2026-08-14 e commitados (68e03962, ec3e59ea, c899d60b,
  9435ffb2, d85a6fb1, 9cd50a17, 68488370): curva de XP 1-100 (beta.48), kill XP via rewards
  verificado (test-kill-xp), questline inicial de 6 missoes na capital (beta.49), loop de quest
  verificado ponta a ponta (test-quest-tracking: kill/craft avancam objetivo sem falso positivo;
  test-quest-rewards: turn-in concede item + reward_exp e marca claimed), 2+ players no mesmo
  room validado (test-multiplayer-state: state real + reflection handshake carrega 2 players),
  wiki expandida.
- Working tree: trabalho em voo das IAs (professions XP, VIP, daily-tasks, drop-boost,
  shop, land gate, achievements, bank, pets, enchant, energy-regen) — testado verde,
  NAO commitado (dono = IAs que o criaram; T1.1).

## Kaetram-Open v0.5.5 - superficie levantada (survey 2026-08-14)

Dados coletados por agentes de survey sobre F:\Kaetram-Open. Servem de referencia
de PARIDADE (features e numeros), nunca de copia (licenca OPL).

| Dimensao | Kaetram (dados reais) |
|---|---|
| Mapa | Unico e contiguo: 1152x1008 tiles (16px). 4 tilesets. Doors 278 (teleport pareado, com gate por quest/achiev/item/skill/level), chests 12+7, signs 14, warps 6 (zonas), overlays de luz 12, music zones 11, dynamic spawns 33. |
| Spawns | 4.226 entidades: mobs 2.258, resources 1.805 (arvores 1.279, forrage 344, rochas 91, pesca 91), NPCs 71. |
| NPCs | 75 entradas, data-driven: role banker/enchanter, store (shop) em 8, quest givers, role masters (blacksmith/herbalist/guild), decoracao. |
| Quests | 21 quests / 82 stages. Tipos de stage: talk 64, kill 8, door 5, cooking 2, tree/fish/npc 1. Gate por quest chain, skill, item. Rewards: xp de skill, gold, itens, unlocks. |
| Crafting | 7 profissoes, 93 receitas: alchemy 8, chiseling 1, cooking 10, crafting 18, fletching 5, smelting 5, smithing 46. Level gate 1-62, xp por craft, chance de falha no smelt. |
| Gathering | 4 skills: fishing (5 spots, lvl 1-10), foraging (11 bushes, lvl 1-25), lumberjacking (26 arvores, lvl 1-50, drop aleatorio), mining (20 rochas, lvl 1-65, respawn 5s-5min). XP+difficulty por node. |
| Achievements | ~80, por categoria: slayer, boss kill, exploracao, gathering milestones, craft, economia, questing. |
| Minigames | 2 (teamwar PvP, coursing PvP) -> SECUNDARIO (PvP). |
| Economia | Moedas: gold (soft) + token (premium). 7 stores com stock por item + refresh timer (30s-10min), buyout de stock, sell com price decay (50%->20%), only stores allowedItems compram. |
| Items | 525: 165 objects, 92 weapons, 81 helmets, 23 chestplates, 18 legs, 16 boots, 49 rings, 21 pendants, 12 shields, 17 archery, 6 magic, 9 arrows, 3 pets, 11 skins. |
| Equip slots | 11: weapon, helmet, chest, legs, boots, shield, cape, pendant, ring, arrows, skins. |
| UI telas | login/registro/guest (parchment), HUD (hp+mana), inventario, equipment panel, profile (state+skills), settings, bank, shop, enchanting, crafting, quest log/detail, achievements, actions, interact menu, trade, friends, guilds, leaderboards, loot bag, notifications, warp menu, ability quickslots, welcome/changelog. |
| Social | friends (cross-server via hub), guilds (ranks/banner/chat), trade 2 players, chat (global/private/guild/local com bolhas), NENHUM party/group. PvP zones + 2 minigames. |
| Admin | painel minimalista (lista de servidores); moderacao via comandos in-game (117 cases: ban/mute/kick/jail/ipban/spawn/teleport/setlevel/addexp). |
| Hub | servidor central: pub/sub WS, registro de servers, rota cross-server (pm/guild/friends), bridge Discord, REST (status/leaderboards/reset senha), Stripe webhook. |
| Comandos in-game | 117 slash commands (player/mod/admin) gated por rank. |
| Personagem | CLASSLESS (sem classe/raca). 17 skills treinaveis (6 combate: health/accuracy/strength/defense/archery/magic + 11 nao-combate). Combat level = 1 + sum(combat skill lvl - 1). HP max = 39 + healthLvl*30; mana = 20 + magicLvl*24. |
| XP/formula | Curva RuneScape: points = floor(0.25 * floor(level + 300*2^(level/7))), acumulada. Max level 120; profissoes 99. XP combate = damage*2/hit (1/4 health + 3/4 skill primaria). |
| Mobs | 148 mobs, level 1-485, HP 15-50.000, aggro range 1-18, respawn 10-180s. 111 aggressive, 7 plugin bosses (skeletonking/ogrelord/hellhound + forestdragon/queenant/piratecap/santa). Drops: chance em 100.000; 137 usam dropTables compartilhadas; 28 drops explicitos; drops gated por quest. |
| Items | 525, tiers materiais (copper->tin->bronze->iron->gold->nisoc->...). 260 exigem skill+level. 12 slots equip. Enchant system separado (shards, 9 efeitos, chance 8*tier%). |
| Abilities | 8 (intimidate/run/dualistsmark/hotshot/thickskin/secretcalling/awareness/precognition), 4 niveis, cooldown 60s, mana 15-21, quickslots. |
| Combate/formulas | Max dmg = (dmgBonus + skillDmgLvl) * 1.25 (*1.5 crit, *1.05-1.15 estilo). Dmg roll randomWeightedInt(0,max,accuracy), accuracy base 0.45. Crit 5% (weapon.isCritical + effectChance). Rock-paper-scissors crush/slash/stab. Poison (venom 5/30s, plague 5/60s). |
| Inventario | Container: inventario 25 slots, bank 420 slots, trade/lootbag containers. Stacking com maxStackSize. |
| Pets | Cosmetic follower only (3 pets), sem combate/leveling. |

---

## 1. Conta, identidade e sessao

| Dimensao | Kaetram (referencia) | VibeCraft / Reldens | Status | Gap -> acao |
|---|---|---|---|---|
| Login | email/username + password | `lib/users`, login-manager, auth hardening (scrypt/TOTP/throttle) | PARTIAL | fluxo cadastro/login publico + UX (T2.2) |
| Cadastro | register | via admin/API; UX publica pendente | PARTIAL | T2.2 |
| Guest | guest login | login-manager suporta guest | PARTIAL | validar UX (T2.2) |
| Persistencia de sessao | save no login | `reldens.beforeJoinGame` + storage | DONE | - |
| Auto-save / quit | logout grava tudo | Colyseus onLeave + storage | DONE | - |

## 2. Personagem e progressao

| Dimensao | Kaetram (referencia) | VibeCraft / Reldens | Status | Gap -> acao |
|---|---|---|---|---|
| Stats base | classless: health/mana derivados de skill lvl; atk/def do equip | `stats` table + `lib/actions` battle | PARTIAL | stats de personagem completos (T2.1) |
| Nivel/XP de personagem | curva RuneScape (max 120), XP = damage*2/hit + quest/skill | curva 1-100 round(15*L^2.4) + atk/def/hp/mp por nivel (beta.48); alimentada por quests/coleta/crafting/farming | DONE | - |
| Skills treinaveis | 17 (6 combate + 11 utilidade) | `lib/skills` + `lib/professions` (XP) | PARTIAL | consolidar skills treinaveis (T2.1/T4.1) |
| Atributos por level | skill-based (sem pontos) | parcial (modifiers) | PARTIAL | T2.1 |
| Classe / path | Kaetram e CLASSLESS (vantagem nossa: classe/path e depth extra) | nao existe | GAP | T2.1 (classe/path = "melhor") |
| Equipamento / paper-doll | 12 slots (helmet/pendant/arrows/chest/weapon/shield/ring/skins/legs/cape/boots) | 12 slot groups + 13 starter items com modifiers (beta.50), obtainable no merchant 112 (beta.51); equip/unequip + modifier pipeline ja existia | PARTIAL | T2.1 look muda com equip (sprites, unico gap restante) |
| Visual do personagem | look muda com equip/skins | sprites base | PARTIAL | T2.1 |
| Respawn | morte -> respawn | `lib/respawn` | DONE | - |

## 3. Combate, criaturas e mobs

| Dimensao | Kaetram (referencia) | VibeCraft / Reldens | Status | Gap -> acao |
|---|---|---|---|---|
| Habilidade/ataque | 8 abilities (debuff/sprint/dmg/tank/passivas), quickslots | `lib/actions` + skills | PARTIAL | consolidar abilities (T2.1) |
| Tipos de dano | melee crush/slash/stab + archery + magic, rock-paper-scissors | `objects_damage_types` 5 eixos (testado) | DONE | vantagem nossa (5 eixos > 3 melee) |
| Mobs | 148 mobs, lvl 1-485, HP 15-50k, aggro range, aggressive/alwaysAggressive | `enemy-object` + creature sheets | PARTIAL | presenca de mobs no mundo (T3.7) |
| Drops | dropTables compartilhadas + drops por mob, chance/100.000 | `lib/rewards` drop-tables (testado) | DONE | - |
| Bosses | 7 bosses com plugin (fases/minions) | padrao documentado (05 §7.3); sem boss real | GAP | T3.8 (preparar) |
| XP por kill | damage*2/hit (health+skill) | rewards.experience por kill -> classPath (verificado test-kill-xp; rato 5, goblin 10, orc 20, golem 50) | DONE | T4.1 balance |
| Status/efeitos | poison/freezing/burning/enchant (9 efeitos) | `lib/status-effects` (testado) | DONE | vantagem nossa |

## 4. Mundo, mapas e ambiente

| Dimensao | Kaetram (referencia) | VibeCraft / Reldens | Status | Gap -> acao |
|---|---|---|---|---|
| Mapa grande unico | 1152x1008 tiles contiguos, 278 doors teleport, 6 warps, zonas | rooms separadas (101 capital, 102 town, 103 farm) + portais | PARTIAL | mundo conectado + transicoes fluidas (T3.2) |
| Tilemap/colisao | tiled | Phaser tilemap + colisao | DONE | - |
| Rios/agua | sim | nao desenhado | GAP | T3.3 (tileset CC0) |
| Terra/grama/caminhos | sim | parcial | PARTIAL | T3.3 |
| Casas/construcoes | sim | nao desenhado | GAP | T3.3 |
| Pontos de interesse/portais | sim | portais 101-102-103 | PARTIAL | T3.2 |
| Criaturas no mundo | sim | parcial (poucos mobs) | GAP | T3.7 |

## 5. NPCs e interacao social no mundo

| Dimensao | Kaetram (referencia) | VibeCraft / Reldens | Status | Gap -> acao |
|---|---|---|---|---|
| NPCs com dialogo | npcs.json (nomes/dialogos) | 5 NPCs da capital com dialogo PT-BR enriquecido (beta.52); falta enchanter + ambientacao + funcao | PARTIAL | T3.4 (enchanter + funcao) |
| Quest-givers | sim | quadro de missoes na capital (object 118) + questline inicial (beta.49) | PARTIAL | T3.4 mais NPCs de quest |
| Merchant / loja | shop NPC | `lib/shop` (cliente) + TraderObject | PARTIAL | T3.5 loja de ferramentas |
| Healer/banker/enchanter/blacksmith | sim | healer/banker/blacksmith no mapa com dialogo; EnchantObject existe no codigo mas falta NPC posicionado | PARTIAL | T3.4 posicionar enchanter + funcao |
| Loja de ferramentas | - (tools no shop) | NAO EXISTE | GAP | T3.5 (MAXIMA) |
| Instrutores de profissoes | - (skills abertas) | NAO EXISTE | GAP | T3.6 (MAXIMA) |

## 6. Sistemas base de jogabilidade

| Dimensao | Kaetram (referencia) | VibeCraft / Reldens | Status | Gap -> acao |
|---|---|---|---|---|
| Quest system | 21 quests / 82 stages (talk/kill/door/cooking/tree/fish) | `lib/quests` (maquina kill/gather/craft) + questline inicial 6 missoes (beta.49); loop verificado ponta a ponta (test-quest-tracking + test-quest-rewards) | PARTIAL | mais quests + tipos talk/door (T2.4/T4.1) |
| Farming | - (nao no kaetram core) | `lib/farming` (crops/timers/yields) | DONE | vantagem nossa (T4.1 balance) |
| Gathering | 4 skills lvl-gated: fishing/foraging/lumberjacking/mining | `lib/gathering` (resources) | PARTIAL | nivelar skills de coleta (T3.3/T4.1) |
| Crafting | 7 profissoes / 93 receitas, level gate 1-62 | `lib/crafting` (receitas) + `lib/professions` (XP) | PARTIAL | volume de receitas + gating por skill (T4.1) |
| Energy | - | `lib/energy` (manager + regen testado) | DONE | T4.1 balance |
| Profissoes | 7 profissoes | `lib/professions` (XP por profissao) | PARTIAL | instrutores (T3.6) + gating (T4.1) |
| Pets | - | `lib/pets` (pet-object, testado) | DONE | avancados = secundario |
| Achievements | achievements | `lib/achievements` (manager testado) | DONE | - |
| Daily tasks | - | `lib/daily-tasks` (pool diario) | PARTIAL | T4.4 pool+rewards |
| VIP | - | `lib/vip` (boost exp/energy/drop) | DONE | T4.3 tiers+UI |
| Moeda soft | gold (soft) + token (premium) | item moeda + economia proxy | PARTIAL | T4.2 sinks/faucets; token premium existe no blockchain |
| Store/stock model | 7 stores, stock por item, refresh timer, buyout, price decay 50%->20% | `lib/shop` (buy/sell) + TraderObject | PARTIAL | stock+refresh+price decay (T3.5/T4.2) |
| Economia telemetria | - | `lib/blockchain` economy-telemetry (testado) | DONE | - |

## 7. Multiplayer e rede

| Dimensao | Kaetram (referencia) | VibeCraft / Reldens | Status | Gap -> acao |
|---|---|---|---|---|
| Multiplayer em tempo real | ws | Colyseus 0.16 | DONE | - |
| 2+ players no mesmo room | sim | State + reflection handshake carrega 2 players (test-multiplayer-state) | DONE | - |
| Sync de estado | sim | Colyseus state sync | DONE | - |
| Chat | global/privado/guild/local + bolhas + profanity filter | `lib/chat` + moderacao + msg-lanes (testado) | DONE | - |
| Amigos | sim (cross-server) | nao existe | GAP | SECUNDARIO (fase 7) |
| Guildas | guilds com ranks/banner/chat | `lib/teams` adaptavel | PARTIAL | SECUNDARIO (fase 7) |
| Trade 2 players | sim | nao existe (inventario so) | GAP | SECUNDARIO (fase 7) |
| Commandos in-game | 117 slash commands | admin tem CMS + comandos | PARTIAL | T6.5 (seguranca) + utilidades dev |
| Admin panel | minimalista (so lista servers) | CMS completo + dashboard | DONE | vantagem nossa |

## 8. UI / UX / cliente

| Dimensao | Kaetram (referencia) | VibeCraft / Reldens | Status | Gap -> acao |
|---|---|---|---|---|
| HUD (vida/mana/xp/energia) | sim (hp+mana, flash, poison tint) | HUD basico; barra de energia | PARTIAL | T5.1 |
| Inventario UI | grid + drag-drop + quickslots | existe | DONE | T5.1 polir |
| Equipamento UI | 11 slots visuais | inventario so | GAP | T2.1/T5.1 |
| Quest tracker | quest log/detail | parcial | PARTIAL | T5.1 |
| Profissoes/XP painel | skills page (lvl+xp) | parcial (client novo) | PARTIAL | T5.1 |
| Settings | sliders audio/brilho, joystick, nomes, levels | existe (settings) | DONE | T5.1 |
| Floating text/splats | dano/cura/xp/skill + MISS | actions damage texts | DONE | - |
| Warp menu | sim (level/quest/cooldown gated) | portais de room | PARTIAL | T3.2/T5.1 |
| Wiki no jogo | - | `wiki.html` (PT-BR), secoes farming/gathering/crafting/energia/combate/quest/progressao/mundo | PARTIAL | T2.5 linkar mais areas + lore |
| Mobile/touch | joystick virtual + responsive | `lib/joystick` existe; nao validado | PARTIAL | T5.4 |
| Audio | musica/sfx manager | `lib/audio` existe | PARTIAL | T5.3 |
| Minimap | NAO existe no Kaetram | `lib/minimap` existe | DONE | vantagem nossa |

## 9. Seguranca e operacao

| Dimensao | Kaetram (referencia) | VibeCraft / Reldens | Status | Gap -> acao |
|---|---|---|---|---|
| Servidor autoritativo | sim | sim (client display-only) | DONE | - |
| Auth hardening | - | scrypt/TOTP/throttle (testado) | DONE | - |
| HTTP blockchain auth | - | rotas aceitam accountId client-asserted | GAP | T1.3 (bearer-token) |
| Rate limit chat/geral | - | msg-lanes, quotas, ip-block (testado) | DONE | - |
| Fresh-install | - | nunca testado do zero | GAP | T6.2 |

---

## Top gaps por prioridade do dono (Fases 2-4)

Atencao a "equivalente ou melhor" — o gap NAO e copiar numeros do Kaetram, e garantir
que cada FEATURE que o jogador de Kaetram tem existe no VibeCraft com qualidade >=:

1. **T2.1 Personagem / paper-doll** — 11 slots de equip (weapon/helmet/chest/legs/boots/
   shield/cape/pendant/ring/arrows/skins), look muda com equip, stats. (MAXIMA)
2. **T2.3 XP de personagem** — curva + acao (kill/quest) + atributos por level. (MAXIMA)
3. **T2.4 Questline inicial + lore** — Kaetram tem 21 quests/82 stages com gate por
   skill/item; nossa maquina cobre os tipos; falta CONTEUDO e gate por skill. (MAXIMA)
4. **T2.2 Login/cadastro UX** — fluxo publico completo (Kaetram tem menu completo). (MAXIMA)
5. **T3.5 Loja de ferramentas** — NPC shop de tools; adotar modelo stock/refresh/price
   decay do Kaetram (economia coerente). (MAXIMA)
6. **T3.6 Instrutores de profissoes** — Kaetram usa role masters + skill gate; nosso
   gating por NPC/profissao. (MAXIMA)
7. **T3.3 Ambiente** — rios/terra/grama/casas; recursos de coleta com LEVEL+difficulty
   (fishing/lumberjacking/mining como skills). (MAXIMA)
8. **T3.7 Mobs no mundo** — Kaetram 2.258 spawns; precisamos de presenca de mobs
   suficiente no mundo vivo (ficha/drops/respawn). (MAXIMA)
9. **T3.4 NPCs** — Kaetram 75 com roles data-driven; nossos NPCs precisam dialogo+
   funcao (banker/enchanter/blacksmith/quest/loja). (MAXIMA)
10. **T3.2 Mapas completos** — mundo conectado (rooms 101-102-103 + transicoes),
    portais, deco; Kaetram e um mapa contiguo 1152x1008. (MAXIMA)

SECUNDARIO (so apos Fases 2-4): pvp, guilds, amigos, trade, leaderboards, minigames,
warp menu, quickslots, eventos, seasons, pets avancados.

---

## Vantagens do VibeCraft sobre o Kaetram (ja "melhor")

- Farming dedicado (crops/timers/yields) — Kaetram nao tem.
- Energy system com regen — Kaetram nao tem.
- VIP com boost exp/energy/drop — Kaetram nao tem.
- Daily-tasks com pool diario — Kaetram nao tem.
- Economia blockchain (wallet/token/faucet/rate-limit) + telemetria — Kaetram so gold/token.
- Achievements manager testado — Kaetram ~80 por data, sem manager dedicado.
- Minimap — Kaetram NAO tem minimap.
- CMS/admin completo (nao so lista de servers como o Kaetram).
- Chat com moderacao/hardening (msg-lanes, quotas, ip-block, filtro) — Kaetram so profanity filter.
- Servidor autoritativo + auth hardening (scrypt/TOTP/throttle).

## Notas

- Kaetram = referencia de FEATURES, nunca de codigo (licenca OPL proibe NFT/cripto;
  so padroes/CC0/proprio no produto).
- Nossa arquitetura e rooms (Reldens), a do Kaetram e um mapa contiguo com regioes.
  A paridade e de FEATURES (mundo conectado com zonas/portais), nao de arquitetura.
- Coluna Kaetram refinada por 3 agentes de survey (world/content, client/social, combat/entities) — completa.
- Items de equip: 12 slots no Kaetram (2 skins). 525 itens, tiers materiais, 260 com req de skill.
  Nosso T2.1 deve cobrir os 12 slots; nosso inventario 25 + bank 420 sao benchmarks a igualar.
- XP: curva RuneScape do Kaetram e referencia de "curva balanceada" para o T2.3 (nao copiar codigo,
  adotar a mesma classe de curva se fizer sentido para a economia do VibeCraft).
