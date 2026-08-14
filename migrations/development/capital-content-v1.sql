--
-- Reldens - Capital content (room 11) - v1
--
-- Wires the existing reldens-capital map into the game:
--   * fixes the room row (tileset image is reldens-town.png)
--   * portals (change points + return points) linking capital <-> town/forest/houses
--   * sets capital as the initial spawn room
--   * places the capital objects (NPCs, doors, craft, quest board, farms, chest,
--     gathering trees, decor, signs) with their assets
--
-- Requires: reldens-install + basic-config + sample-data + beta.40-* modules
-- (crafting, quests, farming, chests, gathering, bank). Safe to re-run (REPLACE).
--

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- ROOM: reldens-capital (exists from an earlier session)
-- ============================================================
REPLACE INTO `rooms` (`id`, `name`, `title`, `map_filename`, `scene_images`, `room_class_key`, `customData`) VALUES
	(101, 'reldens-capital', 'Capital', 'reldens-capital.json', 'reldens-town.png', NULL, '{"allowGuest":true}');

-- ============================================================
-- PORTALS: capital change points
--   18,19 (west road)  -> forest      (mirrors reldens-town)
--   444  (house)       -> house-1
--   951  (house)       -> house-2
--   598  (plaza portal)-> town        (capital <-> town hub)
-- ============================================================
REPLACE INTO `rooms_change_points` (`id`, `room_id`, `tile_index`, `next_room_id`) VALUES
	(21, 11, 18, 5),
	(22, 11, 19, 5),
	(23, 11, 444, 2),
	(24, 11, 951, 3),
	(25, 11, 598, 4);

-- town plaza portal -> capital (symmetric with capital 598 -> town)
REPLACE INTO `rooms_change_points` (`id`, `room_id`, `tile_index`, `next_room_id`) VALUES
	(26, 4, 598, 11);

-- ============================================================
-- RETURN POINTS
--   town/forest/houses need a return point for players coming FROM capital
--   (fetchNewPosition matches by from_room_id). Capital's default = spawn.
-- ============================================================
REPLACE INTO `rooms_return_points` (`id`, `room_id`, `direction`, `x`, `y`, `is_default`, `from_room_id`) VALUES
	(102, 4, 'down', 720, 400, 0, 11),   -- town: arrive from capital (plaza)
	(103, 5, 'down', 690, 768, 0, 11),   -- forest: arrive from capital
	(104, 2, 'down', 560, 600, 0, 11),   -- house-1: arrive from capital
	(105, 3, 'down', 650, 590, 0, 11),   -- house-2: arrive from capital
	(106, 11, 'down', 720, 400, 0, 4),   -- capital: arrive from town (plaza portal)
	(107, 11, 'down', 720, 480, 1, NULL); -- capital: default spawn (player spawn)

-- ============================================================
-- CONFIG: capital is the initial room for new players
-- ============================================================
REPLACE INTO `config` (`id`, `scope`, `path`, `value`, `type`) VALUES
	(335, 'server', 'players/initialState/room_id', '11', 2),
	(336, 'server', 'players/initialState/x', '720', 2),
	(337, 'server', 'players/initialState/y', '480', 2);

-- ============================================================
-- OBJECTS (room 11) - ids 110+
-- ============================================================
REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
	(110, 11, 'ground-collisions', 444, 2, 'capital_door_1', 'door_house_1', 'House Door', '{"runOnHit":true,"roomVisible":true,"yFix":6}', '{"positionFix":{"y":-18},"frameStart":0,"frameEnd":3,"repeat":0,"hideOnComplete":false,"autoStart":false,"restartTime":2000}', 1),
	(111, 11, 'ground-collisions', 951, 2, 'capital_door_2', 'door_house_2', 'House Door', '{"runOnHit":true,"roomVisible":true,"yFix":6}', '{"positionFix":{"y":-18},"frameStart":0,"frameEnd":3,"repeat":0,"hideOnComplete":false,"autoStart":false,"restartTime":2000}', 1),
	(112, 11, 'house-collisions-over-player', 498, 5, 'capital_mercador', 'merchant_1', 'Mercador da Capital', '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}', '{"content":"Hi there! What would you like to do?","options":{"buy":{"label":"Buy","value":"buy"},"sell":{"label":"Sell","value":"sell"}}}', 1),
	(113, 11, 'house-collisions-over-player', 508, 3, 'capital_ferreiro', 'weapons_master_1', 'Ferreiro da Capital', '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}', '{"content":"Hi, I am the weapons master of the capital, choose your weapon and go kill some monsters!","options":{"1":{"key":"axe","label":"Axe","value":1,"icon":"axe"},"2":{"key":"spear","label":"Spear","value":2,"icon":"spear"}},"ui":true}', 1),
	(114, 11, 'house-collisions-over-player', 358, 3, 'capital_quests', 'quest_npc_1', 'Avisos da Capital', '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}', '{"content":"Hi there! Do you want a coin? I can give you one if you give me a tree branch.","options":{"1":{"label":"Sure!","value":1},"2":{"label":"No, thank you.","value":2}},"ui":true}', 1),
	(115, 11, 'house-collisions-over-player', 554, 3, 'capital_healer', 'healer_1', 'Curadora', '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}', '{"content":"Hello traveler! I can restore your health, would you like me to do it?","options":{"1":{"label":"Heal HP","value":1},"2":{"label":"Nothing...","value":2},"3":{"label":"Need some MP","value":3}},"ui":true}', 1),
	(116, 11, 'house-collisions-over-player', 560, 12, 'capital_banker', 'banker_1', 'Banqueiro', '{"runOnAction":true,"playerVisible":true}', '{"content":"Welcome to the capital bank.","ui":true}', 1),
	(117, 11, 'house-collisions-over-player', 411, 8, 'capital_craft', 'crafting_station_1', 'Bancada de Trabalho', '{"runOnAction":true,"playerVisible":true}', '{"content":"What would you like to craft?","options":{"craft":{"label":"Craft","value":"craft"}},"ui":true}', 1),
	(118, 11, 'house-collisions-over-player', 354, 9, 'capital_board', 'quest_board_1', 'Quadro de Missões', '{"runOnAction":true,"playerVisible":true}', '{"content":"Choose an option to manage your quests.","ui":true}', 1),
	(119, 11, 'house-collisions-over-player', 391, 3, 'capital_farm_1', 'farm_plot_1', 'Plantação', '{"runOnAction":true,"playerVisible":true}', '{"content":"A farm plot. Plant a seed and come back to harvest.","ui":true}', 1),
	(120, 11, 'house-collisions-over-player', 441, 3, 'capital_farm_2', 'farm_plot_2', 'Plantação', '{"runOnAction":true,"playerVisible":true}', '{"content":"A farm plot. Plant a seed and come back to harvest.","ui":true}', 1),
	(121, 11, 'house-collisions-over-player', 370, 10, 'capital_chest', 'chest_1', 'Baú do Tesouro', '{"runOnAction":true,"playerVisible":true}', '{"content":"A chest. Open it to receive loot.","ui":true}', 1),
	(122, 11, 'over-player', 550, 2, 'capital_fonte', 'fonte_praca', 'Fonte da Praça', '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(123, 11, 'over-player', 294, 2, 'capital_portal', 'portal_capital', 'Portal da Capital', '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(124, 11, 'forest-collisions', 769, 11, 'capital_tree_1', 'tree_1', 'Carvalho', '{"runOnAction":true,"playerVisible":true}', '{"content":"A tree full of wood.","ui":true}', 1),
	(125, 11, 'forest-collisions', 771, 11, 'capital_tree_2', 'tree_2', 'Pinheiro', '{"runOnAction":true,"playerVisible":true}', '{"content":"A tree full of wood.","ui":true}', 1),
	(126, 11, 'forest-collisions', 779, 11, 'capital_tree_3', 'tree_3', 'Árvore de Blocos', '{"runOnAction":true,"playerVisible":true}', '{"content":"A tree full of wood.","ui":true}', 1),
	(127, 11, 'over-player', 738, 2, 'capital_bush_1', 'bush_1', 'Arbusto', '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(128, 11, 'over-player', 739, 2, 'capital_flower_red', 'flower_red_1', 'Flor Vermelha', '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(129, 11, 'over-player', 740, 2, 'capital_flower_yellow', 'flower_yellow_1', 'Flor Amarela', '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(130, 11, 'over-player', 741, 2, 'capital_grass', 'grass_1', 'Grama', '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(131, 11, 'over-player', 560, 2, 'capital_rock', 'rock_1', 'Pedra', '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(132, 11, 'over-player', 558, 2, 'capital_log', 'log_1', 'Tronco', '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(133, 11, 'over-player', 555, 2, 'capital_mushroom', 'mushroom_1', 'Cogumelo', '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(134, 11, 'house-collisions-over-player', 602, 3, 'capital_sign_1', 'sign_1', 'Placa', '{"runOnAction":true,"playerVisible":true}', '{"content":"Bem-vindo à Capital! Fale com o Mercador, o Ferreiro e a Curadora. Use o Portal Central para viajar."}', 1),
	(135, 11, 'house-collisions-over-player', 603, 3, 'capital_sign_2', 'sign_2', 'Placa', '{"runOnAction":true,"playerVisible":true}', '{"content":"A floresta fica a oeste. Corte árvores para coletar madeira e complete missões no quadro de avisos."}', 1);

-- ============================================================
-- OBJECTS ASSETS
-- ============================================================
REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
	(105, 110, 'spritesheet', 'door_house_1', 'door-a-x2.png', '{"frameWidth":32,"frameHeight":58}'),
	(106, 111, 'spritesheet', 'door_house_2', 'door-a-x2.png', '{"frameWidth":32,"frameHeight":58}'),
	(107, 112, 'spritesheet', 'merchant_1', 'journeyman.png', '{"frameWidth":52,"frameHeight":71}'),
	(108, 113, 'spritesheet', 'weapons_master_1', 'warrior.png', '{"frameWidth":52,"frameHeight":71}'),
	(109, 114, 'spritesheet', 'quest_npc_1', 'people-quest-npc.png', '{"frameWidth":52,"frameHeight":71}'),
	(110, 115, 'spritesheet', 'healer_1', 'healer-1.png', '{"frameWidth":52,"frameHeight":71}'),
	(111, 116, 'spritesheet', 'banker_1', 'people-b-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(112, 117, 'spritesheet', 'crafting_station_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(113, 118, 'spritesheet', 'quest_board_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(114, 119, 'spritesheet', 'farm_plot_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(115, 120, 'spritesheet', 'farm_plot_2', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(116, 121, 'spritesheet', 'chest_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(117, 122, 'spritesheet', 'fonte_praca', 'prop_statue.png', '{"frameWidth":32,"frameHeight":32}'),
	(118, 123, 'spritesheet', 'portal_capital', 'prop_runed_door.png', '{"frameWidth":32,"frameHeight":32}'),
	(119, 124, 'spritesheet', 'tree_1', 'tree_oak.png', '{"frameWidth":63,"frameHeight":112}'),
	(120, 125, 'spritesheet', 'tree_2', 'tree_pineTallB.png', '{"frameWidth":45,"frameHeight":177}'),
	(121, 126, 'spritesheet', 'tree_3', 'tree_blocks.png', '{"frameWidth":77,"frameHeight":108}'),
	(122, 127, 'spritesheet', 'bush_1', 'plant_bush.png', '{"frameWidth":29,"frameHeight":22}'),
	(123, 128, 'spritesheet', 'flower_red_1', 'flower_redA.png', '{"frameWidth":14,"frameHeight":27}'),
	(124, 129, 'spritesheet', 'flower_yellow_1', 'flower_yellowA.png', '{"frameWidth":14,"frameHeight":17}'),
	(125, 130, 'spritesheet', 'grass_1', 'grass.png', '{"frameWidth":32,"frameHeight":23}'),
	(126, 131, 'spritesheet', 'rock_1', 'rock_smallA.png', '{"frameWidth":32,"frameHeight":17}'),
	(127, 132, 'spritesheet', 'log_1', 'log.png', '{"frameWidth":63,"frameHeight":16}'),
	(128, 133, 'spritesheet', 'mushroom_1', 'mushroom_red.png', '{"frameWidth":16,"frameHeight":18}'),
	(129, 134, 'spritesheet', 'sign_1', 'prop_statue.png', '{"frameWidth":32,"frameHeight":32}'),
	(130, 135, 'spritesheet', 'sign_2', 'prop_statue.png', '{"frameWidth":32,"frameHeight":32}');

-- ============================================================
-- MERCHANT INVENTORY (object 112): buy + sell
-- ============================================================
REPLACE INTO `objects_items_inventory` (`id`, `owner_id`, `item_id`, `qty`, `remaining_uses`, `is_active`) VALUES
	(9, 112, 4, -1, -1, 0),
	(10, 112, 5, -1, -1, 0),
	(11, 112, 3, -1, 1, 0),
	(12, 112, 6, -1, 1, 0);

REPLACE INTO `objects_items_requirements` (`id`, `object_id`, `item_key`, `required_item_key`, `required_quantity`, `auto_remove_requirement`) VALUES
	(8, 112, 'axe', 'coins', 5, 1),
	(9, 112, 'spear', 'coins', 2, 1),
	(10, 112, 'heal_potion_20', 'coins', 2, 1),
	(11, 112, 'magic_potion_20', 'coins', 2, 1);

REPLACE INTO `objects_items_rewards` (`id`, `object_id`, `item_key`, `reward_item_key`, `reward_quantity`, `reward_item_is_required`) VALUES
	(8, 112, 'axe', 'coins', 2, 0),
	(9, 112, 'spear', 'coins', 1, 0),
	(10, 112, 'heal_potion_20', 'coins', 1, 0),
	(11, 112, 'magic_potion_20', 'coins', 1, 0),
	(12, 121, 'coins', 'coins', 10, 0),
	(13, 121, 'wood', 'wood', 3, 0);

-- ============================================================
-- GATHERING RESOURCES (trees 124-126): chop for wood
-- ============================================================
REPLACE INTO `gathering_resources` (`id`, `code`, `label`, `object_id`, `item_id`, `experience`, `difficulty`, `level_requirement`, `max_yields`, `respawn_time`, `min_qty`, `max_qty`, `is_active`) VALUES
	(2, 'capital_tree_wood', 'Capital Wooden Tree', 124, 7, 5, 1500, 1, 3, 20000, 1, 2, 1),
	(3, 'capital_pine_wood', 'Capital Pine Tree', 125, 7, 6, 1800, 1, 3, 25000, 1, 2, 1),
	(4, 'capital_blocks_wood', 'Capital Blocks Tree', 126, 7, 7, 2000, 2, 4, 30000, 1, 3, 1);

SET FOREIGN_KEY_CHECKS = 1;
