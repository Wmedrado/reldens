--

SET FOREIGN_KEY_CHECKS = 0;

--

-- ============================================================
-- VIBECRAFT DEMO CONTENT (v1)
-- Seed content for the Vibecraft demo room (room id 100).
-- Uses explicit ids starting at 100 to avoid clashing with the
-- sample data ids (1-15). Safe to run multiple times (REPLACE).
-- Requires: reldens-install-v4.0.0.sql, reldens-basic-config
-- and reldens-sample-data to be applied first (items types,
-- stats, operation types and sample sprites are referenced).
-- ============================================================

-- ============================================================
-- ROOM: vibecraft-demo
-- Map: theme/default/assets/maps/vibecraft-demo.json (30x20, tile 32px)
-- Image: theme/default/assets/maps/kenney-dungeon.png
-- NOTE: the map was extended with a "respawn-area-monsters"
-- tilelayer (4 spawn tiles, all other tiles empty) so the respawn
-- plugin can spawn the enemy. The other map layers are untouched.
-- ============================================================

REPLACE INTO `rooms` (`id`, `name`, `title`, `map_filename`, `scene_images`, `room_class_key`, `customData`) VALUES
	(100, 'vibecraft-demo', 'Vibecraft Demo', 'vibecraft-demo.json', 'kenney-dungeon.png', NULL, '{"allowGuest":true}');

-- Return points for room 100 (pixel based, sample pattern).
REPLACE INTO `rooms_return_points` (`id`, `room_id`, `direction`, `x`, `y`, `is_default`, `from_room_id`) VALUES
	(100, 100, 'down', 14, 2, 1, NULL),
	(101, 100, 'up', 14, 17, NULL, NULL);

-- ============================================================
-- CONFIG: player avatar settings for the 32x32 Kenney sprites
-- The client reads the player size from the child paths below
-- (scene-preloader.js: client/players/size/width|height) and the
-- default 12-frame directional layout from
-- client/players/animations/defaultFrames/* (the exact split path
-- pattern used by reldens-basic-config). A single JSON row at
-- client/players/size would override the merged children object
-- read by lifebar-ui.js, so the parent JSON row is intentionally
-- NOT added.
-- ============================================================

REPLACE INTO `config` (`id`, `scope`, `path`, `value`, `type`) VALUES
	(500, 'client', 'players/size/width', '32', 2),
	(501, 'client', 'players/size/height', '32', 2),
	(502, 'client', 'players/size/topOffset', '0', 2),
	(503, 'client', 'players/size/leftOffset', '0', 2),
	(504, 'client', 'players/animations/fallbackImage', 'player-base.png', 1),
	(505, 'client', 'players/animations/defaultFrames/down/start', '0', 2),
	(506, 'client', 'players/animations/defaultFrames/down/end', '2', 2),
	(507, 'client', 'players/animations/defaultFrames/left/start', '3', 2),
	(508, 'client', 'players/animations/defaultFrames/left/end', '5', 2),
	(509, 'client', 'players/animations/defaultFrames/right/start', '6', 2),
	(510, 'client', 'players/animations/defaultFrames/right/end', '8', 2),
	(511, 'client', 'players/animations/defaultFrames/up/start', '9', 2),
	(512, 'client', 'players/animations/defaultFrames/up/end', '11', 2),
	(513, 'client', 'players/avatarOptions', '{"hero-1":"Hero 1","hero-2":"Hero 2","hero-3":"Hero 3","hero-4":"Hero 4","hero-5":"Hero 5","hero-6":"Hero 6","ranger-1":"Ranger","mage-1":"Mage"}', 4);

-- NOTE: config id 513 "client/players/avatarOptions" is a CUSTOM
-- config row. No engine code reads this path, so it is safe to add.
-- The player avatarKey is resolved by the engine from the class
-- path key (lib/actions/server/player-enricher.js) and its sprite
-- is loaded from /assets/custom/sprites/{avatarKey}.png. To make
-- these avatars selectable, add skills_class_path rows whose key
-- matches one of the avatar keys above (e.g. hero-1). The default
-- 12-frame layout above already matches the generated sprites.

-- ============================================================
-- ITEMS (ids 100+)
-- Item types (items_types): 1 equipment, 2 usable, 3 single,
-- 4 single_equipment, 5 single_usable, 10 base.
-- Sample pattern: coins = type 3 single, potions = type 5
-- single_usable (with uses_limit 1 and removeAfterUse), weapons =
-- equipment boosted by items_item_modifiers. Group id is NULL to
-- keep the items out of the sample equipment groups.
-- ============================================================

REPLACE INTO `items_item` (`id`, `key`, `type`, `group_id`, `label`, `description`, `qty_limit`, `uses_limit`, `useTimeOut`, `execTimeOut`, `customData`) VALUES
	(100, 'wooden_sword', 4, NULL, 'Wooden Sword', 'A sturdy wooden sword, perfect for a first adventure.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
	(101, 'health_potion', 5, NULL, 'Health Potion', 'A potion that restores 20 HP.', 0, 1, NULL, NULL, '{"canBeDropped":true,"animationData":{"frameWidth":64,"frameHeight":64,"start":6,"end":11,"repeat":0,"usePlayerPosition":true,"followPlayer":true,"startsOnTarget":true},"removeAfterUse":true}'),
	(102, 'coins', 3, NULL, 'Coins', NULL, 0, 1, NULL, NULL, '{"canBeDropped": true}'),
	(103, 'rusty_key', 3, NULL, 'Rusty Key', 'An old rusted key, what could it open?', 0, 1, NULL, NULL, '{"canBeDropped":true}'),
	(104, 'crystal_shard', 3, NULL, 'Crystal Shard', 'A glowing shard of pure crystal.', 0, 1, NULL, NULL, '{"canBeDropped":true,"nft":true,"mint":"placeholder-mint-address"}');

-- Modifiers: wooden_sword boosts attack (operation 5 = increment
-- percentage, same as the sample axe) and health_potion heals HP
-- (operation 1 = increment with maxProperty, same as the sample
-- heal potion).
REPLACE INTO `items_item_modifiers` (`id`, `item_id`, `key`, `property_key`, `operation`, `value`, `maxProperty`) VALUES
	(100, 100, 'atk', 'stats/atk', 5, '5', NULL),
	(101, 101, 'health_potion', 'stats/hp', 1, '20', 'statsBase/hp');

-- ============================================================
-- OBJECTS (ids 100+, room 100)
-- Layer decisions:
-- - NPCs and the door use the "ground" layer. Static objects are
--   only created when their (layer_name, tile_index) matches a
--   non-zero tile of that layer (p2world createRoomObjectBody),
--   and the ground layer is fully floored, so every interior tile
--   works. Sprite depth on the client is Y based, so the layer
--   does not affect rendering.
-- - The enemy uses class_type 7 (multiple) + childObjectType 4
--   (enemy) on the new "respawn-area-monsters" layer (tile_index
--   NULL), because the respawn plugin only activates layers whose
--   name contains "respawn-area". The four spawn tiles on that
--   layer (rows 8-9, cols 14-15) mark the respawn area.
-- - No change-point is linked to the door: the map change-points
--   layer is empty and there is no next room, so the door is a
--   decorative animation only.
-- ============================================================

REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
	(100, 100, 'ground', 374, 3, 'vibecraft_guide', 'guide_npc_1', 'Vibecraft Guide', '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}', '{"content":"Welcome to Vibecraft! I am the guide of this realm. Explore the dungeon, defeat the sprouts and collect their treasures.","options":{"1":{"label":"Who are you?","value":1},"2":{"label":"How do I fight?","value":2},"3":{"label":"Goodbye.","value":3}},"ui":true}', 1),
	(101, 100, 'ground', 434, 3, 'vibecraft_elder', 'guide_npc_2', 'Elder Oak', '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}', '{"content":"Long ago the crystal shards powered this place. Now only the sprouts remain. Bring me shards and you will be rewarded.","options":{"1":{"label":"I will find them.","value":1},"2":{"label":"Goodbye.","value":2}},"ui":true}', 1),
	(102, 100, 'respawn-area-monsters', NULL, 7, 'vibecraft_enemy', 'enemy_forest_1', 'Dungeon Sprout', '{"shouldRespawn":true,"childObjectType":4,"isAggressive":true}', '{"autoStart":true}', 1),
	(103, 100, 'ground', 405, 2, 'vibecraft_door', 'door_dungeon_1', 'Dungeon Door', '{"runOnHit":true,"roomVisible":true,"yFix":6}', '{"positionFix":{"y":-18},"frameStart":0,"frameEnd":3,"repeat":0,"hideOnComplete":false,"autoStart":false,"restartTime":2000}', 1);

-- Object assets: NPCs use the generated 32x32 Kenney avatars,
-- the enemy reuses the existing sample monster sprite and the
-- door reuses the sample door sprite (all files verified present
-- under theme/default/assets/custom/sprites/).
REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
	(100, 100, 'spritesheet', 'guide_npc_1', 'hero-1.png', '{"frameWidth":32,"frameHeight":32}'),
	(101, 101, 'spritesheet', 'guide_npc_2', 'hero-4.png', '{"frameWidth":32,"frameHeight":32}'),
	(102, 102, 'spritesheet', 'enemy_forest_1', 'monster-treant.png', '{"frameWidth":47,"frameHeight":50}'),
	(103, 103, 'spritesheet', 'door_dungeon_1', 'door-a-x2.png', '{"frameWidth":32,"frameHeight":58}');

-- Enemy animations (sample format: {layer_name}_{object_id}_{dir}).
REPLACE INTO `objects_animations` (`id`, `object_id`, `animationKey`, `animationData`) VALUES
	(100, 102, 'respawn-area-monsters_102_right', '{"start":6,"end":8}'),
	(101, 102, 'respawn-area-monsters_102_down', '{"start":0,"end":2}'),
	(102, 102, 'respawn-area-monsters_102_left', '{"start":3,"end":5}'),
	(103, 102, 'respawn-area-monsters_102_up', '{"start":9,"end":11}');

-- Enemy stats (sample pattern: all 10 stats set to 50).
REPLACE INTO `objects_stats` (`id`, `object_id`, `stat_id`, `base_value`, `value`) VALUES
	(100, 102, 1, 50, 50),
	(101, 102, 2, 50, 50),
	(102, 102, 3, 50, 50),
	(103, 102, 4, 50, 50),
	(104, 102, 5, 50, 50),
	(105, 102, 6, 50, 50),
	(106, 102, 7, 50, 50),
	(107, 102, 8, 50, 50),
	(108, 102, 9, 50, 50),
	(109, 102, 10, 50, 50);

-- Enemy combat skill (sample: skill 1 attackBullet targeting
-- players, target_options id 2 = player).
REPLACE INTO `objects_skills` (`id`, `object_id`, `skill_id`, `target_id`) VALUES
	(100, 102, 1, 2);

-- Enemy respawn (layer matches the new map layer, 1 instance).
REPLACE INTO `respawn` (`id`, `object_id`, `respawn_time`, `instances_limit`, `layer`) VALUES
	(100, 102, 30000, 1, 'respawn-area-monsters');

-- Enemy rewards: drops 3 coins (item 102, drop animation already
-- defined by the sample data) plus 10 experience.
REPLACE INTO `rewards` (`id`, `object_id`, `item_id`, `modifier_id`, `experience`, `drop_rate`, `drop_quantity`, `is_unique`, `was_given`, `has_drop_body`) VALUES
	(100, 102, 102, NULL, 10, 100, 3, 0, 0, 1);

--

SET FOREIGN_KEY_CHECKS = 1;

--
