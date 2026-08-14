--
-- Reldens - Enchant and Pets demo data
--
-- Creates an enchanter NPC, a pet dealer NPC, the catalyst / pet-egg items,
-- one enchantment recipe and one adoptable pet on the town room (room 4).
--

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `objects_types` (`id`, `key`) VALUES (13, 'enchanter'), (14, 'petdealer');

REPLACE INTO `items_item` (`id`, `key`, `type`, `group_id`, `label`, `description`, `qty_limit`, `uses_limit`, `useTimeOut`, `execTimeOut`, `customData`) VALUES
    (10, 'shard_magic', 3, NULL, 'Magic Shard', 'A glowing shard used by the enchanter.', 0, 1, NULL, NULL, '{"canBeDropped":true}'),
    (11, 'pet_egg', 3, NULL, 'Pet Egg', 'Adopt a companion pet at the pet dealer.', 0, 1, NULL, NULL, '{"canBeDropped":true}');

REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (21, 4, 'house-collisions-over-player', 525, 13, 'enchanter_1', 'enchanter_1', 'Enchanter',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"I can upgrade your gear.","ui":true}', 1),
    (22, 4, 'house-collisions-over-player', 526, 14, 'petdealer_1', 'petdealer_1', 'Pet Dealer',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"Adopt a loyal companion.","ui":true}', 1),
    (23, 4, 'house-collisions-over-player', 527, 15, 'achievement_board_1', 'achievement_board_1', 'Achievements Board',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"Your achievements.","ui":true}', 1);

REPLACE INTO `objects_types` (`id`, `key`) VALUES (15, 'achievement');

REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
    (19, 21, 'spritesheet', 'enchanter_1', 'people-c-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (20, 22, 'spritesheet', 'petdealer_1', 'people-b-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (21, 23, 'spritesheet', 'achievement_board_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}');

REPLACE INTO `enchantments` (`id`, `code`, `label`, `input_item_id`, `catalyst_item_id`, `output_item_id`, `output_qty`, `is_active`) VALUES
    (1, 'axe_to_spear', 'Axe → Spear', 4, 10, 5, 1, 1);

REPLACE INTO `pets` (`id`, `key`, `label`, `adopt_item_id`, `is_active`) VALUES
    (1, 'pixel_slime', 'Pixel Slime', 11, 1);

REPLACE INTO `achievements` (`id`, `code`, `label`, `description`, `type`, `target_key`, `quantity`, `reward_item_id`, `reward_exp`, `is_active`) VALUES
    (1, 'first_wood', 'Wood Gatherer', 'Gather 10 wood.', 'gather', 'tree_wood', 10, NULL, 25, 1),
    (2, 'first_craft', 'Crafter', 'Craft 3 items.', 'craft', NULL, 3, NULL, 30, 1),
    (3, 'first_kill', 'Slayer', 'Kill 5 monsters.', 'kill', NULL, 5, NULL, 20, 1);

SET FOREIGN_KEY_CHECKS = 1;
