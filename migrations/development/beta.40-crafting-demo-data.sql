--
-- Reldens - Crafting feature demo data
--
-- Creates a "crafting" object type, demo items, a global wood-plank recipe
-- and a crafting station object on the town room (room 4).
--

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `objects_types` (`id`, `key`) VALUES (8, 'crafting');

REPLACE INTO `items_item` (`id`, `key`, `type`, `group_id`, `label`, `description`, `qty_limit`, `uses_limit`, `useTimeOut`, `execTimeOut`, `customData`) VALUES
    (7, 'wood', 3, NULL, 'Wood', 'Raw wood used for crafting.', 0, 1, NULL, NULL, '{"canBeDropped":true}'),
    (8, 'wood_plank', 3, NULL, 'Wood Plank', 'A crafted wooden plank.', 0, 1, NULL, NULL, '{"canBeDropped":true}');

REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (16, 4, 'house-collisions-over-player', 520, 8, 'craft_station_1', 'crafting_station_1', 'Crafting Table',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"What would you like to craft?","options":{"craft":{"label":"Craft","value":"craft"}},"ui":true}', 1);

REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
    (14, 16, 'spritesheet', 'crafting_station_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}');

REPLACE INTO `crafting_recipes` (`id`, `code`, `label`, `description`, `object_id`, `skill_id`, `skill_level_required`, `crafting_time_seconds`, `is_active`) VALUES
    (1, 'wood_plank', 'Wood Plank', 'Craft a wooden plank from raw wood.', NULL, NULL, 1, 2, 1);

REPLACE INTO `crafting_recipes_items` (`id`, `recipe_id`, `item_id`, `quantity`, `type`) VALUES
    (1, 1, 7, 2, 'ingredient'),
    (2, 1, 8, 1, 'result');

SET FOREIGN_KEY_CHECKS = 1;
