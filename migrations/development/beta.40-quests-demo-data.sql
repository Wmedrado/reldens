--
-- Reldens - Quests feature demo data
--
-- Creates a "quest" object type, a quest board object on the town room
-- (room 4) and three demo quests (kill / gather / craft).
--

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `objects_types` (`id`, `key`) VALUES (9, 'quest');

REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (17, 4, 'house-collisions-over-player', 521, 9, 'quest_board_1', 'quest_board_1', 'Quest Board',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"Choose an option to manage your quests.","ui":true}', 1);

REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
    (15, 17, 'spritesheet', 'quest_board_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}');

REPLACE INTO `quests` (`id`, `code`, `label`, `description`, `object_id`, `reward_exp`, `is_active`) VALUES
    (1, 'kill_trees', 'Kill Trees', 'Hunt down the tree monsters in the forest.', NULL, 20, 1),
    (2, 'gather_wood', 'Gather Wood', 'Collect 5 raw wood from the forest.', NULL, 10, 1),
    (3, 'craft_wood_plank', 'Craft Wood Planks', 'Craft a wooden plank at a crafting table.', NULL, 15, 1);

REPLACE INTO `quests_objectives` (`id`, `quest_id`, `type`, `target_key`, `quantity`, `label`) VALUES
    (1, 1, 'kill', 'enemy_1', 2, 'Kill Tree monsters'),
    (2, 2, 'gather', 'wood', 5, 'Collect Wood'),
    (3, 3, 'craft', 'wood_plank', 1, 'Craft Wood Plank');

-- NOTE: item 1 was "coins" in the original base migration (beta.12) and was later
--   renumbered to 102, so quest rewards must point at coins (102).
REPLACE INTO `quests_rewards` (`id`, `quest_id`, `item_id`, `quantity`) VALUES
    (1, 2, 102, 5),
    (2, 3, 102, 3);

SET FOREIGN_KEY_CHECKS = 1;
