--
-- Reldens - Fix farming item id collision
--
-- beta.40-farming-demo-data.sql originally used item ids 9/10 for carrot_seed/carrot,
-- but 9 = stone (base) and 10 = shard_magic (enchant) already existed, so REPLACE
-- clobbered them. carrot/carrot_seed never landed in the DB and farming_crops pointed
-- seed_item_id=9 (stone) and harvest_item_id=10 (shard_magic).
--
-- Fix (idempotent):
--   - register carrot_seed = 114 and carrot = 115 (free ids),
--   - re-point farming_crops row 1,
--   - re-point shop inventory row 7 (carrot_seed stock, was pointing at item 9 = stone),
--   - fix daily_tasks reward_item_id=1 (dangling) -> coins (102),
--   - remove stale drops_animations row 1 (coins animation, item 1 no longer exists;
--     row id 102 already covers coins and item_id is UNIQUE),
--   - re-point quests_rewards item_id 1 (old coins id) -> coins (102).
--

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `items_item` (`id`, `key`, `type`, `group_id`, `label`, `description`, `qty_limit`, `uses_limit`, `useTimeOut`, `execTimeOut`, `customData`) VALUES
    (114, 'carrot_seed', 3, NULL, 'Carrot Seed', 'A seed used to grow carrots.', 0, 1, NULL, NULL, '{"canBeDropped":true}'),
    (115, 'carrot', 3, NULL, 'Carrot', 'A fresh carrot grown on a farm plot.', 0, 1, NULL, NULL, '{"canBeDropped":true}');

REPLACE INTO `farming_crops` (`id`, `key`, `label`, `description`, `seed_item_id`, `harvest_item_id`, `growth_time_seconds`, `exp_reward`, `energy_cost`, `harvests`, `is_active`) VALUES
    (1, 'carrot', 'Carrot', 'Plant a carrot seed and harvest a carrot.', 114, 115, 30, 5, 1, 1, 1);

-- Shop inventory: row 7 was carrot_seed stock pointing at item 9 (now stone).
UPDATE `objects_items_inventory` SET `item_id` = 114 WHERE `id` = 7 AND `item_id` = 9;

-- daily_gather reward pointed at non-existent item 1 -> coins (102).
UPDATE `daily_tasks` SET `reward_item_id` = 102 WHERE `id` = 1 AND `reward_item_id` = 1;

-- coins drop animation row 1 is stale (item 1 never existed; row id 102 covers coins).
DELETE FROM `drops_animations` WHERE `id` = 1 AND `item_id` = 1;

-- quests_rewards pointed at old coins id 1 -> coins (102).
UPDATE `quests_rewards` SET `item_id` = 102 WHERE `item_id` = 1;

SET FOREIGN_KEY_CHECKS = 1;
