--
-- Reldens - Vibecraft Farm: two more creatures (T3.7)
--
-- Extends the farm (room 103) roster from 4 to 6 mobs, following the exact
-- contract established in beta.48-vibecraft-creatures.sql (class_type 7 multiple
-- + childObjectType 4 enemy, 12-frame directional spritesheet, 10 stats, 1 skill,
-- respawn on the "respawn-area-monsters" layer, coins+XP reward, damage-type
-- profile). No new tables, no new sprites, no map changes: it reuses the existing
-- spawn layer and CC0 monster sprites already under assets/custom/sprites/.
--
-- New roster (slotted into the existing weak -> tough progression):
--   * Kobold (404) - weak/fast, between rat and goblin, weak to slash
--   * Gnoll  (405) - medium, between goblin and orc, weak to crush, resists archery
--
-- Ids continue the beta.48 namespace (404+), avoiding sample/demo/capital/town/farm
-- ranges. Safe to re-run (REPLACE). Requires beta.48-vibecraft-creatures.sql first
-- (creates objects_damage_types / drop_tables and the respawn layer contract).
--

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- OBJECTS (room 103) - enemies, class_type 7 (multiple/enemy)
-- ============================================================
REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (404, 103, 'respawn-area-monsters', 412, 7, 'vibecraft_farm_kobold', 'enemy_kobold_1', 'Farm Kobold',
     '{"shouldRespawn":true,"childObjectType":4,"isAggressive":true}',
     '{"autoStart":true}', 1),
    (405, 103, 'respawn-area-monsters', 458, 7, 'vibecraft_farm_gnoll', 'enemy_gnoll_1', 'Farm Gnoll',
     '{"shouldRespawn":true,"childObjectType":4,"isAggressive":true}',
     '{"autoStart":true}', 1);

-- ============================================================
-- OBJECTS ASSETS (32x32 monsters, 12-frame horizontal strip)
-- ============================================================
REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
    (404, 404, 'spritesheet', 'enemy_kobold_1', 'kobold.png', '{"frameWidth":32,"frameHeight":32}'),
    (405, 405, 'spritesheet', 'enemy_gnoll_1', 'gnoll.png', '{"frameWidth":32,"frameHeight":32}');

-- ============================================================
-- OBJECTS ANIMATIONS (12-frame directional layout)
-- ============================================================
REPLACE INTO `objects_animations` (`id`, `object_id`, `animationKey`, `animationData`) VALUES
    (440, 404, 'respawn-area-monsters_404_down', '{"start":0,"end":2}'),
    (441, 404, 'respawn-area-monsters_404_left', '{"start":3,"end":5}'),
    (442, 404, 'respawn-area-monsters_404_right', '{"start":6,"end":8}'),
    (443, 404, 'respawn-area-monsters_404_up', '{"start":9,"end":11}'),
    (450, 405, 'respawn-area-monsters_405_down', '{"start":0,"end":2}'),
    (451, 405, 'respawn-area-monsters_405_left', '{"start":3,"end":5}'),
    (452, 405, 'respawn-area-monsters_405_right', '{"start":6,"end":8}'),
    (453, 405, 'respawn-area-monsters_405_up', '{"start":9,"end":11}');

-- ============================================================
-- OBJECTS STATS (stats 1..10 = hp,mp,atk,def,dodge,speed,aim,stamina,mgk-atk,mgk-def)
-- ============================================================
REPLACE INTO `objects_stats` (`id`, `object_id`, `stat_id`, `base_value`, `value`) VALUES
    (440, 404, 1, 40, 40),
    (441, 404, 2, 0, 0),
    (442, 404, 3, 10, 10),
    (443, 404, 4, 4, 4),
    (444, 404, 5, 12, 12),
    (445, 404, 6, 50, 50),
    (446, 404, 7, 10, 10),
    (447, 404, 8, 15, 15),
    (448, 404, 9, 0, 0),
    (449, 404, 10, 3, 3),
    (450, 405, 1, 70, 70),
    (451, 405, 2, 0, 0),
    (452, 405, 3, 16, 16),
    (453, 405, 4, 8, 8),
    (454, 405, 5, 5, 5),
    (455, 405, 6, 35, 35),
    (456, 405, 7, 12, 12),
    (457, 405, 8, 25, 25),
    (458, 405, 9, 0, 0),
    (459, 405, 10, 6, 6);

-- ============================================================
-- OBJECTS SKILLS (skill 1 attackBullet, target 2 = player)
-- ============================================================
REPLACE INTO `objects_skills` (`id`, `object_id`, `skill_id`, `target_id`) VALUES
    (404, 404, 1, 2),
    (405, 405, 1, 2);

-- ============================================================
-- RESPAWN (layer matches the existing map layer)
-- ============================================================
REPLACE INTO `respawn` (`id`, `object_id`, `respawn_time`, `instances_limit`, `layer`) VALUES
    (404, 404, 20000, 3, 'respawn-area-monsters'),
    (405, 405, 28000, 2, 'respawn-area-monsters');

-- ============================================================
-- REWARDS (coins + experience)
-- ============================================================
REPLACE INTO `rewards` (`id`, `object_id`, `item_id`, `modifier_id`, `experience`, `drop_rate`, `drop_quantity`, `is_unique`, `was_given`, `has_drop_body`) VALUES
    (404, 404, 102, NULL, 8, 100, 2, 0, 0, 1),
    (405, 405, 102, NULL, 15, 100, 5, 0, 0, 1);

-- ============================================================
-- DAMAGE TYPE PROFILES (negative defense = weakness, positive = resistance)
-- ============================================================
REPLACE INTO `objects_damage_types` (`id`, `object_id`, `damage_type`, `defense_value`, `multiplier`) VALUES
    (409, 404, 'slash', -2, NULL),
    (410, 405, 'crush', -3, NULL),
    (411, 405, 'archery', 2, NULL);

-- ============================================================
-- DROP TABLE LINK (gnoll shares the weapon drop table; kobold is coins-only)
-- ============================================================
REPLACE INTO `objects_drop_tables` (`id`, `object_id`, `drop_table_id`) VALUES
    (403, 405, 400);

SET FOREIGN_KEY_CHECKS = 1;
