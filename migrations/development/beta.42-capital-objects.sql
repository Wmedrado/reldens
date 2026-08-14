--
-- Reldens - Capital room (101) interactive objects
--
-- Populates the capital hub with interactive objects matching the custom
-- classes registered in theme/plugins/server-plugin.js (capital_* keys).
-- Unique object_class_key per row + unique (room_id, layer_name, tile_index).
--

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (200, 101, 'house-collisions-over-player', 500, 12, 'capital_banker', 'capital_banker', 'Banker',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"Welcome to the capital bank. Safe storage for your valuables.","ui":true}', 1),
    (201, 101, 'house-collisions-over-player', 562, 3, 'capital_ferreiro', 'capital_ferreiro', 'Ferreiro',
     '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}',
     '{"content":"Hi, I am the blacksmith of the capital. Pick a weapon and go explore!","options":{"1":{"key":"axe","label":"Axe","value":1,"icon":"axe"},"2":{"key":"spear","label":"Spear","value":2,"icon":"spear"}},"ui":true}', 1),
    (202, 101, 'house-collisions-over-player', 538, 3, 'capital_healer', 'capital_healer', 'Healer',
     '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}',
     '{"content":"Hello traveler! I can restore your health.","options":{"1":{"label":"Heal HP","value":1},"2":{"label":"Nothing...","value":2},"3":{"label":"Need some MP","value":3}},"ui":true}', 1),
    (203, 101, 'house-collisions-over-player', 535, 3, 'capital_quests', 'capital_quests', 'Quest Master',
     '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}',
     '{"content":"The capital needs your help! Accept a quest.","options":{"quests":{"label":"Quests","value":"quests"}},"ui":true}', 1),
    (204, 101, 'house-collisions-over-player', 370, 10, 'capital_chest', 'capital_chest', 'Treasure Chest',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"A chest filled with loot.","ui":true}', 1),
    (205, 101, 'house-collisions-over-player', 411, 8, 'capital_craft', 'capital_craft', 'Crafting Table',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"What would you like to craft?","options":{"craft":{"label":"Craft","value":"craft"}},"ui":true}', 1),
    (206, 101, 'house-collisions-over-player', 354, 9, 'capital_board', 'capital_board', 'Quest Board',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"Choose an option to manage your quests.","ui":true}', 1),
    (207, 101, 'house-collisions-over-player', 391, 11, 'capital_farm_1', 'capital_farm_1', 'Farm Plot',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"A farm plot. Plant a seed and come back to harvest.","ui":true}', 1),
    (208, 101, 'house-collisions-over-player', 441, 11, 'capital_farm_2', 'capital_farm_2', 'Farm Plot',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"A farm plot. Plant a seed and come back to harvest.","ui":true}', 1),
    (209, 101, 'house-collisions-over-player', 769, 11, 'capital_tree_1', 'capital_tree_1', 'Wooden Tree',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"A tree full of wood.","ui":true}', 1),
    (210, 101, 'house-collisions-over-player', 771, 11, 'capital_tree_2', 'capital_tree_2', 'Wooden Tree',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"A tree full of wood.","ui":true}', 1),
    (211, 101, 'house-collisions-over-player', 779, 11, 'capital_tree_3', 'capital_tree_3', 'Wooden Tree',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"A tree full of wood.","ui":true}', 1);

REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
    (200, 200, 'spritesheet', 'capital_banker', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (201, 201, 'spritesheet', 'capital_ferreiro', 'people-c-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (202, 202, 'spritesheet', 'capital_healer', 'healer-1.png', '{"frameWidth":52,"frameHeight":71}'),
    (203, 203, 'spritesheet', 'capital_quests', 'people-b-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (204, 204, 'spritesheet', 'capital_chest', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (205, 205, 'spritesheet', 'capital_craft', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (206, 206, 'spritesheet', 'capital_board', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (207, 207, 'spritesheet', 'capital_farm_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (208, 208, 'spritesheet', 'capital_farm_2', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (209, 209, 'spritesheet', 'capital_tree_1', 'tree_oak.png', '{"frameWidth":63,"frameHeight":112}'),
    (210, 210, 'spritesheet', 'capital_tree_2', 'tree_pineTallB.png', '{"frameWidth":45,"frameHeight":177}'),
    (211, 211, 'spritesheet', 'capital_tree_3', 'tree_blocks.png', '{"frameWidth":77,"frameHeight":108}');

SET FOREIGN_KEY_CHECKS = 1;
