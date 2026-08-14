--
-- VibeCraft - Starter questline (T2.4 - questline inicial + lore)
-- -----------------------------------------------------------------
-- A coherent new-player arc anchored to the capital quest board
-- (object 118, "Quadro de Missoes"). Teaches the three core loops the
-- game already tracks (kill / gather / craft) against real content:
--   enemies  : vibecraft_farm_rat/goblin/orc/golem  (beta.48-vibecraft-creatures)
--   item     : wood (id 7, gathered from farm trees)  (beta.40-crafting-demo-data)
--   recipe   : wood_plank (id 1, crafted at the capital/town bench)
--   currency : coins (item 102)
-- reward_exp escalates 15 -> 60 so the arc feeds the T2.3 XP curve
-- (beta.48-character-xp-curve) and takes a fresh player through
-- level 1 into level 2-3.
-- Safe to re-run (REPLACE INTO). Idempotent on (code) / (quest_id,type,target_key)
-- via natural REPLACE key behaviour (PRIMARY KEY id below).
--

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `quests` (`id`, `code`, `label`, `description`, `object_id`, `reward_exp`, `is_active`) VALUES
    (4, 'capital_rats', 'Ratos na Fazenda',
     'As colheitas da Fazenda Vibecraft estao sendo devoradas por ratos. O fazendeiro Leandro precisa de ajuda - prove seu valor eliminando 3 ratos no campo ao sul da capital.',
     118, 15, 1),
    (5, 'farm_wood', 'Madeira para a Capital',
     'O carpinteiro da capital precisa de toras para reparar a ponte da vila. Corte 5 arvores na fazenda e colete a madeira.',
     118, 10, 1),
    (6, 'first_plank', 'A Primeira Tábua',
     'Com a madeira em maos, use a bancada de trabalho da capital para criar uma tabua de madeira. Todo construtor comeca por uma tabua.',
     118, 15, 1),
    (7, 'farm_goblins', 'Goblins Salteadores',
     'Goblins estao roubando as ferramentas dos trabalhadores da fazenda. Enfrente 3 deles e recupere a paz no campo.',
     118, 25, 1),
    (8, 'road_orcs', 'O Caminho dos Orcs',
     'Orcs bloquearam a estrada para o leste da fazenda. Derrube 2 para reabrir a passagem dos viajantes.',
     118, 40, 1),
    (9, 'stone_golem', 'O Golem Ancestral',
     'Diz a lenda que um golem de pedra guarda os segredos antigos da fazenda. Vença-o e receba a bencao da terra de VibeCraft.',
     118, 60, 1);

REPLACE INTO `quests_objectives` (`id`, `quest_id`, `type`, `target_key`, `quantity`, `label`) VALUES
    (4, 4, 'kill', 'vibecraft_farm_rat', 3, 'Eliminar Ratos da Fazenda'),
    (5, 5, 'gather', 'wood', 5, 'Coletar Madeira'),
    (6, 6, 'craft', 'wood_plank', 1, 'Criar Tabua de Madeira'),
    (7, 7, 'kill', 'vibecraft_farm_goblin', 3, 'Eliminar Goblins da Fazenda'),
    (8, 8, 'kill', 'vibecraft_farm_orc', 2, 'Eliminar Orcs da Fazenda'),
    (9, 9, 'kill', 'vibecraft_farm_golem', 1, 'Eliminar o Golem de Pedra');

REPLACE INTO `quests_rewards` (`id`, `quest_id`, `item_id`, `quantity`) VALUES
    (3, 4, 102, 5),
    (4, 5, 102, 5),
    (5, 6, 102, 3),
    (6, 7, 102, 10),
    (7, 8, 102, 15),
    (8, 9, 102, 20);

SET FOREIGN_KEY_CHECKS = 1;
