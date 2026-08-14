--
-- Reldens - Farming feature demo data
--
-- Creates a "farm" object type, a carrot crop (seed -> harvest), a farm plot
-- object on the town room (room 4) and the seed/harvest items.
--

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `objects_types` (`id`, `key`) VALUES (11, 'farm');

REPLACE INTO `items_item` (`id`, `key`, `type`, `group_id`, `label`, `description`, `qty_limit`, `uses_limit`, `useTimeOut`, `execTimeOut`, `customData`) VALUES
    (9, 'carrot_seed', 3, NULL, 'Carrot Seed', 'A seed used to grow carrots.', 0, 1, NULL, NULL, '{"canBeDropped":true}'),
    (10, 'carrot', 3, NULL, 'Carrot', 'A fresh carrot grown on a farm plot.', 0, 1, NULL, NULL, '{"canBeDropped":true}');

REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (19, 4, 'house-collisions-over-player', 522, 11, 'farm_plot_1', 'farm_plot_1', 'Farm Plot',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"A farm plot. Plant a seed and come back to harvest.","ui":true}', 1);

REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
    (17, 19, 'spritesheet', 'farm_plot_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}');

REPLACE INTO `farming_crops` (`id`, `key`, `label`, `description`, `seed_item_id`, `harvest_item_id`, `growth_time_seconds`, `exp_reward`, `energy_cost`, `harvests`, `is_active`) VALUES
    (1, 'carrot', 'Carrot', 'Plant a carrot seed and harvest a carrot.', 9, 10, 30, 5, 1, 1, 1);

SET FOREIGN_KEY_CHECKS = 1;
