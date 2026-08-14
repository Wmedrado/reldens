-- Reconcile capital (room 101) content - merge of concurrent agent edits.
SET FOREIGN_KEY_CHECKS = 0;

-- 1) move orphaned objects/change points from non-existent room 11 to capital room 101:
UPDATE `objects` SET `room_id` = 101 WHERE `room_id` = 11;
UPDATE `rooms_change_points` SET `room_id` = 101 WHERE `room_id` = 11;

-- 2) fix blocked / conflicting tile positions (verified against the map collision layers):
--    capital_craft was on blocked tile 363 -> 411 (free)
UPDATE `objects` SET `tile_index` = 411 WHERE `id` = 205;
--    capital_farm_2 was on blocked tile 393 -> 441 (free)
UPDATE `objects` SET `tile_index` = 441 WHERE `id` = 208;
--    trees were placed on the plaza portal tile (598), the fountain tile (550) and 702 -> forest tiles (769/771/779)
UPDATE `objects` SET `tile_index` = 769 WHERE `id` = 209;
UPDATE `objects` SET `tile_index` = 771 WHERE `id` = 210;
UPDATE `objects` SET `tile_index` = 779 WHERE `id` = 211;

-- 3) trees should look like trees, not the treant enemy sprite:
UPDATE `objects_assets` SET `asset_file` = 'tree_oak.png', `extra_params` = '{"frameWidth":63,"frameHeight":112}' WHERE `object_id` = 209;
UPDATE `objects_assets` SET `asset_file` = 'tree_pineTallB.png', `extra_params` = '{"frameWidth":45,"frameHeight":177}' WHERE `object_id` = 210;
UPDATE `objects_assets` SET `asset_file` = 'tree_blocks.png', `extra_params` = '{"frameWidth":77,"frameHeight":108}' WHERE `object_id` = 211;

-- 4) gathering resources for the capital trees (chop for wood, item 7):
REPLACE INTO `gathering_resources` (`id`, `code`, `label`, `object_id`, `item_id`, `experience`, `difficulty`, `level_requirement`, `max_yields`, `respawn_time`, `min_qty`, `max_qty`, `is_active`) VALUES
	(5, 'capital_tree_oak', 'Capital Oak', 209, 7, 5, 1500, 1, 3, 20000, 1, 2, 1),
	(6, 'capital_tree_pine', 'Capital Pine', 210, 7, 6, 1800, 1, 3, 25000, 1, 2, 1),
	(7, 'capital_tree_blocks', 'Capital Block Tree', 211, 7, 7, 2000, 2, 4, 30000, 1, 3, 1);

-- 5) chest rewards (the quest master chest on tile 370 had none configured):
REPLACE INTO `objects_items_rewards` (`id`, `object_id`, `item_key`, `reward_item_key`, `reward_quantity`, `reward_item_is_required`) VALUES
	(14, 204, 'coins', 'coins', 10, 0),
	(15, 204, 'wood', 'wood', 3, 0);

-- 6) quest master should use the standard QuestNpc flow (branch -> coin, or close):
UPDATE `objects` SET `client_params` = '{"content":"Hi there! Do you want a coin? I can give you one if you give me a tree branch.","options":{"1":{"label":"Sure!","value":1},"2":{"label":"No, thank you.","value":2}},"ui":true}' WHERE `id` = 203;

SET FOREIGN_KEY_CHECKS = 1;
