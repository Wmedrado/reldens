--
-- Reldens - Vibecraft playable maps (rooms 102 town / 103 farm)
--
-- Registers two playable CC0 maps built on the Kenney dungeon tileset:
--   * vibecraft-town.json (40x30) - player hub: healer, blacksmith, quest
--     master, crafting table, banker, enchanter, daily tasks board, signs,
--     decorative trees/bushes/flowers/rocks. South gate portal -> farm.
--   * vibecraft-farm.json (40x30) - farm area: 3 farm plots, 3 gathering
--     trees, a loot chest, signs, decorative props. North gate portal -> town.
--
-- The custom object classes (vibecraft_*) are registered in
-- theme/plugins/server-plugin.js (defineCustomClasses). Unique
-- object_class_key per row + unique (room_id, layer_name, tile_index).
-- Ids 300+ avoid clashing with sample (1-24), vibecraft (100-104),
-- capital (110-135) and capital objects (200-211).
-- Safe to re-run (REPLACE).
--
-- Requires: reldens-install + basic-config + sample-data + beta.40-* modules
-- (crafting, quests, farming, chests, gathering, bank, enchant, daily-tasks).
--

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- ROOMS
-- ============================================================
REPLACE INTO `rooms` (`id`, `name`, `title`, `map_filename`, `scene_images`, `room_class_key`, `customData`) VALUES
	(102, 'vibecraft-town', 'Vibecraft Town', 'vibecraft-town.json', 'kenney-dungeon.png', NULL, '{"allowGuest":true}'),
	(103, 'vibecraft-farm', 'Vibecraft Farm', 'vibecraft-farm.json', 'kenney-dungeon.png', NULL, '{"allowGuest":true}');

-- ============================================================
-- CHANGE POINTS (portals)
--   102 tile 1140 (col 20, row 28, south gate) -> 103
--   103 tile 60   (col 20, row 1,  north gate)  -> 102
-- ============================================================
REPLACE INTO `rooms_change_points` (`id`, `room_id`, `tile_index`, `next_room_id`) VALUES
	(30, 102, 1140, 103),
	(31, 103, 60, 102);

-- ============================================================
-- RETURN POINTS
--   town default = plaza spawn; farm default = north field spawn.
--   from_room_id rows place the player near the matching portal.
-- ============================================================
REPLACE INTO `rooms_return_points` (`id`, `room_id`, `direction`, `x`, `y`, `is_default`, `from_room_id`) VALUES
	(110, 102, 'down', 656, 400, 1, NULL),   -- town: default spawn (plaza)
	(111, 102, 'down', 656, 784, 0, 103),    -- town: arrive from farm (south gate)
	(112, 103, 'up', 656, 176, 1, NULL),     -- farm: default spawn (north field)
	(113, 103, 'down', 656, 144, 0, 102);    -- farm: arrive from town (north gate)

-- ============================================================
-- OBJECTS: VIBECRAFT TOWN (room 102) - ids 300-315
-- ============================================================
REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
	(300, 102, 'ground', 410, 3, 'vibecraft_town_healer', 'healer_1', 'Healer',
	 '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}',
	 '{"content":"Hello traveler! I can restore your health.","options":{"1":{"label":"Heal HP","value":1},"2":{"label":"Nothing...","value":2},"3":{"label":"Need some MP","value":3}},"ui":true}', 1),
	(301, 102, 'ground', 415, 3, 'vibecraft_town_blacksmith', 'weapons_master_1', 'Blacksmith',
	 '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}',
	 '{"content":"I am the weapons master. Pick a weapon and go explore!","options":{"1":{"key":"axe","label":"Axe","value":1,"icon":"axe"},"2":{"key":"spear","label":"Spear","value":2,"icon":"spear"}},"ui":true}', 1),
	(302, 102, 'ground', 420, 3, 'vibecraft_town_quest', 'quest_npc_1', 'Quest Master',
	 '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}',
	 '{"content":"The town needs your help! Accept a quest.","options":{"quests":{"label":"Quests","value":"quests"}},"ui":true}', 1),
	(303, 102, 'ground', 506, 8, 'vibecraft_town_craft', 'crafting_station_1', 'Crafting Table',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"What would you like to craft?","options":{"craft":{"label":"Craft","value":"craft"}},"ui":true}', 1),
	(304, 102, 'ground', 510, 12, 'vibecraft_town_banker', 'banker_1', 'Banker',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"Welcome to the town bank. Safe storage for your valuables.","ui":true}', 1),
	(305, 102, 'ground', 572, 13, 'vibecraft_town_enchanter', 'enchanter_1', 'Enchanter',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"I can upgrade your gear.","ui":true}', 1),
	(306, 102, 'ground', 588, 16, 'vibecraft_town_dailytask', 'dailytask_board_1', 'Daily Tasks Board',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"Your daily tasks.","ui":true}', 1),
	(307, 102, 'ground', 500, 3, 'vibecraft_town_sign_1', 'sign_1', 'Sign',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"Welcome to Vibecraft Town! Talk to the Healer, the Blacksmith, the Quest Master and the Enchanter. Use the south gate to reach the farm."}', 1),
	(308, 102, 'ground', 980, 3, 'vibecraft_town_sign_2', 'sign_2', 'Sign',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"The south gate leads to the farm. Plant crops on the plots, chop trees for wood and open the treasure chest."}', 1),
	(309, 102, 'ground', 728, 2, 'vibecraft_town_tree_a', 'tree_1', 'Oak Tree',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(310, 102, 'ground', 751, 2, 'vibecraft_town_tree_b', 'tree_2', 'Pine Tree',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(311, 102, 'ground', 810, 2, 'vibecraft_town_bush', 'bush_1', 'Bush',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(312, 102, 'ground', 829, 2, 'vibecraft_town_flower', 'flower_red_1', 'Red Flower',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(313, 102, 'ground', 666, 2, 'vibecraft_town_rock', 'rock_1', 'Rock',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(314, 102, 'ground', 654, 2, 'vibecraft_town_mushroom', 'mushroom_1', 'Mushroom',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(315, 102, 'ground', 652, 2, 'vibecraft_town_grass', 'grass_1', 'Grass',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1);

-- ============================================================
-- OBJECTS: VIBECRAFT FARM (room 103) - ids 320-332
-- ============================================================
REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
	(320, 103, 'ground', 410, 11, 'vibecraft_farm_plot_1', 'farm_plot_1', 'Farm Plot',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"A farm plot. Plant a seed and come back to harvest.","ui":true}', 1),
	(321, 103, 'ground', 414, 11, 'vibecraft_farm_plot_2', 'farm_plot_2', 'Farm Plot',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"A farm plot. Plant a seed and come back to harvest.","ui":true}', 1),
	(322, 103, 'ground', 418, 11, 'vibecraft_farm_plot_3', 'farm_plot_3', 'Farm Plot',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"A farm plot. Plant a seed and come back to harvest.","ui":true}', 1),
	(323, 103, 'ground', 326, 101, 'vibecraft_farm_tree_1', 'tree_1', 'Oak Tree',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"A tree full of wood.","ui":true}', 1),
	(324, 103, 'ground', 353, 101, 'vibecraft_farm_tree_2', 'tree_2', 'Pine Tree',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"A tree full of wood.","ui":true}', 1),
	(325, 103, 'ground', 646, 101, 'vibecraft_farm_tree_3', 'tree_3', 'Blocks Tree',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"A tree full of wood.","ui":true}', 1),
	(326, 103, 'ground', 750, 10, 'vibecraft_farm_chest', 'chest_1', 'Treasure Chest',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"A chest filled with loot.","ui":true}', 1),
	(327, 103, 'ground', 220, 3, 'vibecraft_farm_sign', 'sign_1', 'Sign',
	 '{"runOnAction":true,"playerVisible":true}',
	 '{"content":"Welcome to the Vibecraft Farm! Plant carrot seeds on the plots, chop the trees for wood and open the chest in the corner.","ui":true}', 1),
	(328, 103, 'ground', 248, 2, 'vibecraft_farm_bush', 'bush_1', 'Bush',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(329, 103, 'ground', 660, 2, 'vibecraft_farm_flower', 'flower_yellow_1', 'Yellow Flower',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(330, 103, 'ground', 584, 2, 'vibecraft_farm_grass', 'grass_1', 'Grass',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(331, 103, 'ground', 826, 2, 'vibecraft_farm_rock', 'rock_1', 'Rock',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1),
	(332, 103, 'ground', 816, 2, 'vibecraft_farm_mushroom', 'mushroom_1', 'Mushroom',
	 '{}', '{"frameStart":0,"frameEnd":0,"repeat":-1,"autoStart":true,"depthByPlayer":"above"}', 1);

-- ============================================================
-- OBJECTS ASSETS (all files exist under theme/default/assets/custom/sprites/)
-- ============================================================
REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
	(300, 300, 'spritesheet', 'healer_1', 'healer-1.png', '{"frameWidth":52,"frameHeight":71}'),
	(301, 301, 'spritesheet', 'weapons_master_1', 'warrior.png', '{"frameWidth":52,"frameHeight":71}'),
	(302, 302, 'spritesheet', 'quest_npc_1', 'people-quest-npc.png', '{"frameWidth":52,"frameHeight":71}'),
	(303, 303, 'spritesheet', 'crafting_station_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(304, 304, 'spritesheet', 'banker_1', 'people-b-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(305, 305, 'spritesheet', 'enchanter_1', 'people-c-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(306, 306, 'spritesheet', 'dailytask_board_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(307, 307, 'spritesheet', 'sign_1', 'prop_statue.png', '{"frameWidth":32,"frameHeight":32}'),
	(308, 308, 'spritesheet', 'sign_2', 'prop_statue.png', '{"frameWidth":32,"frameHeight":32}'),
	(309, 309, 'spritesheet', 'tree_1', 'tree_oak.png', '{"frameWidth":63,"frameHeight":112}'),
	(310, 310, 'spritesheet', 'tree_2', 'tree_pineTallB.png', '{"frameWidth":45,"frameHeight":177}'),
	(311, 311, 'spritesheet', 'bush_1', 'plant_bush.png', '{"frameWidth":29,"frameHeight":22}'),
	(312, 312, 'spritesheet', 'flower_red_1', 'flower_redA.png', '{"frameWidth":14,"frameHeight":27}'),
	(313, 313, 'spritesheet', 'rock_1', 'rock_smallA.png', '{"frameWidth":32,"frameHeight":17}'),
	(314, 314, 'spritesheet', 'mushroom_1', 'mushroom_red.png', '{"frameWidth":16,"frameHeight":18}'),
	(315, 315, 'spritesheet', 'grass_1', 'grass.png', '{"frameWidth":32,"frameHeight":23}'),
	(320, 320, 'spritesheet', 'farm_plot_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(321, 321, 'spritesheet', 'farm_plot_2', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(322, 322, 'spritesheet', 'farm_plot_3', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(323, 323, 'spritesheet', 'tree_1', 'tree_oak.png', '{"frameWidth":63,"frameHeight":112}'),
	(324, 324, 'spritesheet', 'tree_2', 'tree_pineTallB.png', '{"frameWidth":45,"frameHeight":177}'),
	(325, 325, 'spritesheet', 'tree_3', 'tree_blocks.png', '{"frameWidth":77,"frameHeight":108}'),
	(326, 326, 'spritesheet', 'chest_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
	(327, 327, 'spritesheet', 'sign_1', 'prop_statue.png', '{"frameWidth":32,"frameHeight":32}'),
	(328, 328, 'spritesheet', 'bush_1', 'plant_bush.png', '{"frameWidth":29,"frameHeight":22}'),
	(329, 329, 'spritesheet', 'flower_yellow_1', 'flower_yellowA.png', '{"frameWidth":14,"frameHeight":17}'),
	(330, 330, 'spritesheet', 'grass_1', 'grass.png', '{"frameWidth":32,"frameHeight":23}'),
	(331, 331, 'spritesheet', 'rock_1', 'rock_smallA.png', '{"frameWidth":32,"frameHeight":17}'),
	(332, 332, 'spritesheet', 'mushroom_1', 'mushroom_red.png', '{"frameWidth":16,"frameHeight":18}');

-- ============================================================
-- GATHERING RESOURCES (farm trees 323-325): chop for wood (item 7)
-- ============================================================
REPLACE INTO `gathering_resources` (`id`, `code`, `label`, `object_id`, `item_id`, `experience`, `difficulty`, `level_requirement`, `max_yields`, `respawn_time`, `min_qty`, `max_qty`, `is_active`) VALUES
	(10, 'vibecraft_farm_oak_wood', 'Vibecraft Farm Oak', 323, 7, 5, 1500, 1, 3, 20000, 1, 2, 1),
	(11, 'vibecraft_farm_pine_wood', 'Vibecraft Farm Pine', 324, 7, 6, 1800, 1, 3, 25000, 1, 2, 1),
	(12, 'vibecraft_farm_blocks_wood', 'Vibecraft Farm Blocks', 325, 7, 7, 2000, 2, 4, 30000, 1, 3, 1);

-- ============================================================
-- CHEST REWARDS (object 326): coins + wood
-- ============================================================
REPLACE INTO `objects_items_rewards` (`id`, `object_id`, `item_key`, `reward_item_key`, `reward_quantity`, `reward_item_is_required`) VALUES
	(20, 326, 'coins', 'coins', 10, 0),
	(21, 326, 'wood', 'wood', 3, 0);

SET FOREIGN_KEY_CHECKS = 1;
