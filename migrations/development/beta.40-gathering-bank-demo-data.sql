--
-- Reldens - Gathering and Bank demo data
--
-- Creates a "gathering" tree node and a "banker" NPC on the town room
-- (room 4), a "stone" item, and the demo resource config.
--

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `objects_types` (`id`, `key`) VALUES (11, 'gathering'), (12, 'banker');

REPLACE INTO `items_item` (`id`, `key`, `type`, `group_id`, `label`, `description`, `qty_limit`, `uses_limit`, `useTimeOut`, `execTimeOut`, `customData`) VALUES
    (9, 'stone', 3, NULL, 'Stone', 'A rock chunk used for crafting and building.', 0, 1, NULL, NULL, '{"canBeDropped":true}');

REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (19, 4, 'house-collisions-over-player', 523, 11, 'tree_1', 'tree_1', 'Wooden Tree',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"A tree full of wood.","ui":true}', 1),
    (20, 4, 'house-collisions-over-player', 524, 12, 'banker_1', 'banker_1', 'Banker',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"Welcome to the bank.","ui":true}', 1);

REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
    (17, 19, 'spritesheet', 'tree_1', 'monster-treant.png', '{"frameWidth":47,"frameHeight":50}'),
    (18, 20, 'spritesheet', 'banker_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}');

REPLACE INTO `gathering_resources` (`id`, `code`, `label`, `object_id`, `item_id`, `experience`, `difficulty`, `level_requirement`, `max_yields`, `respawn_time`, `min_qty`, `max_qty`, `is_active`) VALUES
    (1, 'tree_wood', 'Wooden Tree', 19, 7, 5, 1500, 1, 3, 20000, 1, 2, 1);

SET FOREIGN_KEY_CHECKS = 1;
