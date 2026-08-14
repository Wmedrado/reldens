--
-- Reldens - Chests feature demo data
--
-- Creates a "chest" object type and a loot chest on the town room (room 4)
-- with configured rewards (coins + wood).
--

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `objects_types` (`id`, `key`) VALUES (10, 'chest');

REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (18, 4, 'house-collisions-over-player', 522, 10, 'chest_1', 'chest_1', 'Loot Chest',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"A chest. Open it to receive loot.","ui":true}', 1);

REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
    (16, 18, 'spritesheet', 'chest_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}');

REPLACE INTO `objects_items_rewards` (`id`, `object_id`, `item_key`, `reward_item_key`, `reward_quantity`, `reward_item_is_required`) VALUES
    (6, 18, 'coins', 'coins', 10, 0),
    (7, 18, 'wood', 'wood', 3, 0);

SET FOREIGN_KEY_CHECKS = 1;
