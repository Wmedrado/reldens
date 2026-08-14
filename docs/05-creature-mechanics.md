# 05 - Mecânicas de Personagens, Mobs e Criaturas

> Camada de produto/design focada em **combate e criaturas**: como modelamos
> personagens, mobs (enemies) e NPCs de combate, seus atributos, fraquezas,
> comportamento de IA e drops. Base conceitual: estudo do Kaetram-Open
> (`docs/kaetram-map/`), portado como **padrão, nunca como código/asset**
> (regra transversal `00-master-plan.md` §4.1-4.2; OPL proíbe uso de código).

> Status deste doc: vivo. Última consolidação: 2026-08-14.

---

## 1. Por que este documento

O Reldens já entrega a espinha de combate: `EnemyObject` (objeto de sala),
`Pve` (batalha player vs environment), `@reldens/skills` (skills de ataque com
aim/dodge/crit), `@reldens/modifiers` (stats e efeitos), `objects_stats`,
`objects_skills`, `rewards` (drops por objeto). O que o Kaetram tem e o Reldens
ainda não modela é a **camada de "ficha de criatura"**:

1. Vetor de **tipos de dano** (crush/slash/stab/archery/magic) com fraqueza e
   resistência por eixo.
2. **Drop tables compartilhadas** (mobs herdam drops comuns + lista própria).
3. **Override por instância/spawn** (mesmo mob com variação em pontos do mapa).
4. **Plugins de comportamento por mob** (bosses com minions/fases).

Este doc define o desenho dessas mecânicas no stack Reldens e o roadmap em fases
para implementá-las. A Fase 1 (tipos de dano) já tem código e teste.

---

## 2. Análise do Kaetram (resumo para design)

Fonte completa em `docs/kaetram-map/10-gameplay-content-systems.md`. Pontos que
formam o desenho:

### 2.1 Ficha do mob (`mobs.json`)

Campos por tipo de mob: `hitPoints, level, aggroRange, attackRange, aggressive,
alwaysAggressive, attackRate, movementSpeed, respawnDelay, roaming,
roamDistance, projectileName, poisonous, freezing, burning, hiddenName, boss,
miniboss, plugin`.

Stats em **3 blocos**:
- `attackStats` e `defenseStats`: vetores de 5 eixos `{crush, slash, stab,
  archery, magic}`. Defesa **negativa = fraqueza** (toma mais dano), positiva =
  resistência.
- `bonuses`: `{accuracy, strength, archery, magic}` (bônus flat).
- `skills`: níveis base `{accuracy, strength, defense, archery, magic}`.

### 2.2 Override por spawn (`spawns.json`)

Chave = coordenada `x-y`. Sobrescreve campos da ficha base do mob naquela
instância (miniboss, HP maior, aggro, achievement, plugin). Permite 50 mobs
iguais no mapa com variação pontual.

### 2.3 Drop tables (`tables.json`) + drops próprios

`drops` = lista pessoal (item + `chance` em 100.000 + gating por quest/
achievement). `dropTables` = chaves de `tables.json` (tabelas globais
compartilhadas). No death: 1 item da lista pessoal + 1 item por drop table.

### 2.4 Plugins de mob (`data/plugins/mobs/*`)

Handler custom por mob (extends do handler padrão): bosses spawnam minions
(skeletonking), fases por HP, ataques em área (attackAll), alteração de alvo.

### 2.5 Combate (conceitual, não transcrever)

- Loop por personagem: intervalo `attackRate / 4`.
- Dano: `maxDamage = f(estilo de ataque, nível strength/archery/magic)` +
  accuracy (nível + bônus - defesa do alvo) -> weighted random.
- Crítico = multiplicador 1.5x.
- Estilos treinam skills diferentes (accurate/aggressive/defensive/archery/
  magic).

---

## 3. Mapeamento Kaetram -> Reldens

| Mecânica Kaetram | Equivalente Reldens | Estado |
|---|---|---|
| `mobs.json` ficha por tipo | Objeto `enemy` na tabela `objects` + `objects_stats` + `objects_skills` | ok |
| `attackStats/defenseStats` 5 eixos | **`objects_damage_types`** (tabela signed) + `EnemyObject.loadDamageTypes()` | **Fase 2 (feito)** |
| `bonuses` / `skills` do mob | stats com keys no `objects_stats` | config |
| `spawns.json` override por instância | `objects.private_params` / `client_params` (JSON por objeto) + `tile_index` único | ok (ver seção 7.2) |
| `drops` pessoais | tabela `rewards` (drop_rate/drop_quantity) | ok |
| `dropTables` compartilhadas | **`drop_tables` + `drop_tables_items` + `objects_drop_tables`** + `DropTablesLoader`/`DropTablesProcessor` | **Fase 3 (feito)** |
| `plugin` de mob (boss/minions) | classe custom de objeto (`object_class_key`), padrão `farm_plot_1`/`chest` | ok (ver seção 7.3) |
| Dano + accuracy + crit | `@reldens/skills` Attack (aim/dodge/crit) | ok |
| **Tipos de dano aplicados no dano** | `DamageTypes` + listener em `SKILL_BEFORE_RUN_LOGIC` | **Fase 1 (feito)** |

---

## 4. Schema de dados (migration `beta.41-creature-mechanics.sql`)

| Tabela | Finalidade | Campos principais |
|---|---|---|
| `objects_damage_types` | Perfil de fraqueza/resistência por criatura | `object_id`, `damage_type`, `defense_value` (signed, negativo=fraqueza), `multiplier` (override direto) |
| `drop_tables` | Drop tables globais | `key`, `label` |
| `drop_tables_items` | Itens de uma drop table | `drop_table_id`, `item_id`, `chance` (0-100000), `quantity`, `min_player_level`, `required_quest_key`, `required_quest_status`, `required_achievement_key` |
| `objects_drop_tables` | Associação mob -> drop tables | `object_id`, `drop_table_id` |

Execução após aplicar a migration:

```bash
reldens generateEntities --override
```

> **Estado (2026-08-14)**: a migration `beta.41` já foi aplicada no banco de
> desenvolvimento e as entidades foram geradas (`objectsDamageTypes`,
> `dropTables`, `dropTablesItems`, `objectsDropTables`). Um seed de validação
> ligou uma drop table `ordinary` (item branch) ao objeto 6 e uma fraqueza de
> dano `slash: -3`; o fluxo loader/processor/damage-types foi validado de ponta
> a ponta contra o banco.

Nunca editar `generated-entities/` manualmente (hook bloqueia).

---

## 5. Roadmap de implementação (fases)

### Fase 1 - Tipos de dano (feito, validado)

Escopo: sistema de tipos de dano aplicado ao dano de skills de ataque.

- `lib/actions/server/damage-types.js` - constantes dos 5 eixos + fórmulas
  puras: `getSkillDamageType`, `getDamageTypeMultiplier`,
  `applyDamageTypeToSkill`, `restoreDamageTypeFromSkill`.
- `lib/actions/server/damage-type-listener.js` - registra hooks por class path
  de player em `SKILL_BEFORE_RUN_LOGIC` / `SKILL_AFTER_RUN_LOGIC` via evento
  `reldens.actionsPrepareEventsListeners`.
- `lib/actions/server/plugin.js` - `DamageTypeListener.attach(this.events)` no
  setup do ActionsPlugin.
- `tests/test-damage-types.js` - testes puros.

Status: concluído; `node tests/test-damage-types.js` passa.

Como usar: na skill de ataque, colocar `damageType` no `customData`
(ex.: `{"damageType":"slash"}`). No alvo, definir stat `weak_slash` (multiplicador
direto, 0.5 = resiste, 1.5 = fraco) ou `def_slash` (defesa, negativo = fraqueza).
Sem dados = dano neutro (1x).

Verificação:

```bash
node tests/test-damage-types.js
```

Done when: testes passam; dano de skill com `damageType` muda conforme fraqueza/
resistência do alvo; resto fica neutro.

### Fase 2 - Perfil de criatura por tipo de dano (feito)

Escopo: carregar `objects_damage_types` no EnemyObject e usá-lo como fonte de
fraquezas.

Arquivos:

- `lib/objects/server/object/type/enemy-object.js` - `loadDamageTypes()` carrega
  a entidade `objectsDamageTypes` por `object_id` e popula
  `this.damageTypes` com keys `weak_<type>` / `def_<type>` (cada linha pode
  definir `multiplier` direto ou `defense_value` signed).
- `lib/actions/server/damage-types.js` - `getTargetDamageStats()` resolve a
  fonte com precedência: `target.damageTypes` > `target.stats`.

Verificação:

```bash
node tests/test-damage-types.js
```

Done when: mob com `objects_damage_types` registrados sofre dano ampliado no
eixo de fraqueza; testes de unidade cobrem a precedência.

### Fase 3 - Drop tables compartilhadas (feito)

Escopo: resolver drops das drop tables no death do enemy, somando à lista
pessoal de `rewards`.

Arquivos:

- `lib/rewards/server/drop-tables-loader.js` - carrega `objectsDropTables` com
  relations (`related_drop_tables.related_drop_tables_items.related_items_item`)
  e monta `targetObject.dropTables = [{key, items}]`.
- `lib/rewards/server/drop-tables-processor.js` - por tabela, escolhe 1 item
  aleatório, rola `chance` em escala 100000, aplica gating e converte em
  `Reward` para o pipeline existente.
- `lib/rewards/server/subscribers/object-subscriber.js` - chama o loader junto
  com `enrichWithRewards`.
- `lib/rewards/server/subscribers/rewards-subscriber.js` - `giveRewards` soma os
  rewards das drop tables aos rewards pessoais.

Gating: `min_player_level` (usa classPath) + evento `reldens.dropTablesItemGate`
(plugins podem setar `gate.canDrop = false` para quest/achievement).

Verificação:

```bash
node tests/test-drop-tables.js
```

Done when: mob com drop tables dropa item da tabela com chance granular; gating
por nível funciona; extensão por evento documentada.

### Fase 4 - Documentação de padrões existentes (feito)

Ver seção 7. Documenta a ficha completa da criatura, o override por instância e
os plugins de mob (bosses com minions) no padrão Reldens.

### Fase 5 - Fórmulas de combate avançadas (avaliado: não implementar)

Avaliação concluída: o `@reldens/skills` Attack já implementa aim/dodge/crit com
proporções e operadores configuráveis, e o sistema de tipos de dano cobre o
eixo de fraqueza/resistência. Reimplementar o modelo accuracy-weighted do
Kaetram duplicaria lógica sem ganho claro para o design atual. Decisão: manter
aim/dodge/crit nativos + damage types. Se o balanceamento exigir distribuição
weighted no futuro, reavaliar como fórmula pura testável em
`lib/actions/server/damage-types.js`.

---

## 6. Regras do desenho

1. **Servidor autoritativo**: todo cálculo de dano, fraqueza e drop roda no
   servidor. Cliente só exibe.
2. **Dados via DB**: ficha de criatura = `objects` + `objects_stats` +
   `objects_skills` + `objects_damage_types` + `rewards` + `drop_tables*`.
3. **Multiplicadores neutros por padrão**: criatura sem dados de dano = 1x.
4. **Nada do Kaetram no produto**: padrões sim, código/asset não.
5. **Testes puros** para toda fórmula nova (padrão `tests/test-*.js`).

---

## 7. Padrões de ficha, override e plugins (Fase 4)

### 7.1 Ficha completa da criatura

Tudo é configurado no banco, sem código por criatura:

| O que | Onde | Exemplo |
|---|---|---|
| Identidade e posição | tabela `objects` | `object_class_key`, `client_key`, `tile_index`, `layer_name`, `room_id` |
| Tipo | `objects_types` | `enemy` |
| Stats base | `objects_stats` (stat por key) | `hp: 100`, `atk: 10`, `def: 8` |
| Fraquezas/resistências | `objects_damage_types` | `slash, defense_value: -3` (fraco) |
| Skills de ataque | `objects_skills` + `skills_skill` | skill `bite` com `customData: {"damageType":"slash"}` |
| Comportamento | `private_params` (JSON) | `{"isAggressive":true, "interactionRadio":3}` |
| Drops pessoais | `rewards` | `drop_rate`, `drop_quantity` |
| Drops compartilhados | `objects_drop_tables` + `drop_tables` + `drop_tables_items` | chance 0-100000 |
| Respawn | `respawn` | `respawn_time`, `instances_limit` |

### 7.2 Override por instância

Igual ao `spawns.json` do Kaetram, mas por registro: cada objeto na sala já tem
`tile_index` único (`room_id, layer_name, tile_index`). Variações pontuais (mob
igual, HP maior, miniboss, aggro) vão em `private_params` ou `client_params` do
próprio objeto, sem duplicar classe.

Exemplo em `private_params` de um enemy:

```json
{
    "isAggressive": true,
    "interactionRadio": 4,
    "randomMovement": false
}
```

### 7.3 Plugin de mob (bosses com minions)

Igual ao `plugin` do Kaetram, mas via `object_class_key`: cria-se uma classe
custom que estende `EnemyObject` e registra-se no theme
(`theme/plugins/server-plugin.js`), padrão já usado por `farm_plot_1`, `chest`,
`craft_station_1`.

Esqueleto de boss com minions:

```js
class BossObject extends EnemyObject
{
    async onBattleEnd(event)
    {
        let { playerSchema, room } = event;
        // fase por HP: se abaixo de 50%, spawnar minions.
        if(this.stats.hp <= this.initialStats.hp / 2){
            await this.spawnMinions(room);
        }
        await super.onBattleEnd(event);
    }
}
```

### 7.4 Como ligar o sistema (passo a passo)

1. Aplicar `migrations/development/beta.41-creature-mechanics.sql` e rodar
   `reldens generateEntities --override` (entities `objectsDamageTypes`,
   `dropTables`, `dropTablesItems`, `objectsDropTables`).
2. Criar stats no admin (`stats`): `hp`, `atk`, `def`, e por tipo
   `weak_slash` / `def_slash` (ou usar `objects_damage_types`).
3. Criar enemy (`objects`, tipo `enemy`), stats em `objects_stats`, skill de
   ataque em `objects_skills` com `customData` = `{"damageType":"slash"}`.
4. Fraqueza: inserir linha em `objects_damage_types` (`defense_value` negativo =
   fraqueza) ou stat `weak_slash` no objeto.
5. Drops: `rewards` (pessoal) e/ou `drop_tables` + `drop_tables_items` +
   `objects_drop_tables` (compartilhado, chance 0-100000).
6. Testar: `node tests/test-damage-types.js` e `node tests/test-drop-tables.js`.
