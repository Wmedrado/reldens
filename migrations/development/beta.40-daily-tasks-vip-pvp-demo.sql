--
-- Reldens - Daily tasks demo data and VIP tiers
--

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `objects_types` (`id`, `key`) VALUES (16, 'dailytask');

REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (24, 4, 'house-collisions-over-player', 528, 16, 'dailytask_board_1', 'dailytask_board_1', 'Daily Tasks Board',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"Complete daily tasks for rewards.","ui":true}', 1);

REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
    (22, 24, 'spritesheet', 'dailytask_board_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}');

REPLACE INTO `daily_tasks` (`id`, `code`, `label`, `description`, `type`, `target_key`, `quantity`, `reward_item_id`, `reward_exp`, `is_active`) VALUES
    (1, 'daily_gather', 'Collect 5 Wood', 'Gather 5 wood today.', 'gather', 'tree_wood', 5, 1, 15, 1),
    (2, 'daily_craft', 'Craft 1 Item', 'Craft any item today.', 'craft', NULL, 1, NULL, 10, 1),
    (3, 'daily_kill', 'Kill 3 Monsters', 'Kill 3 monsters today.', 'kill', NULL, 3, 8, 20, 1);

-- VIP tiers (holder tier 0 = free, 1+ = VIP):
INSERT INTO `config` (`scope`, `path`, `value`, `type`) VALUES
    ('server', 'vip/tiers', '{"0":{"label":"Free","expBoost":1,"energyRegenBoost":1},"1":{"label":"VIP","expBoost":1.5,"energyRegenBoost":1.5}}', 4)
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

SET FOREIGN_KEY_CHECKS = 1;
