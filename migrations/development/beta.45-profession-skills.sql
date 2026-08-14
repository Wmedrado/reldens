--
-- Reldens - Profession skills registration (farming, woodcutting, mining,
-- fishing, cooking)
--
-- Registers the five profession skills as real rows in the core skills tables
-- (skills_skill, skills_levels, objects_skills) so they can be displayed and
-- managed as actual skills. The professions module (lib/professions) tracks
-- per-skill XP in `players_profession_skills` using these exact string keys;
-- this migration adds the matching skills_skill rows, a shared level curve
-- (skills_levels_set id 100) and links existing world objects to the skill
-- that each object feeds.
--
-- NOTE on `type`: `skills_skill.type` must map to a registered skill class
-- (defaults in lib/actions/server/data-loader.js: attack=2, effect=3,
-- physical_attack=4, physical_effect=5). Type 1 (base) has no default class,
-- so a type-1 row would throw "Undefined skill type in skillsList" on startup.
-- Type 3 (effect) is used here, matching the parallel seed
-- (beta.45-profession-skills-seed.sql).
--
-- Skill ids (100-105) intentionally reuse the parallel seed ids so the two
-- migrations are compatible in any apply order. `INSERT ... ON DUPLICATE KEY
-- UPDATE` is used (not REPLACE) because objects_skills references skill ids and
-- REPLACE would drop the referenced row, tripping the FK.
--
-- objects_skills.target_id = 2 (player), same as the existing combat rows.
-- object ids were confirmed against the local DB:
--   farming    -> capital_farm_1 (207), capital_farm_2 (208)
--   woodcutting-> tree_1 (19), capital_tree_1 (209), capital_tree_2 (210), capital_tree_3 (211)
--   cooking    -> craft_station_1 (16), capital_craft (205)
-- farm_plot_1 has no `objects` row (only a custom class in the theme), so it is
-- not linked. No new objects are created.
--

SET FOREIGN_KEY_CHECKS = 0;

-- 1) skills_skill rows for the five profession skills.
INSERT INTO `skills_skill`
    (`id`, `key`, `type`, `label`, `skillDelay`, `castTime`, `usesLimit`, `range`, `rangePropertyX`, `rangePropertyY`)
VALUES
    (100, 'farming',     3, 'Farming',     0, 0, 0, 0, 'state/x', 'state/y'),
    (101, 'woodcutting', 3, 'Woodcutting', 0, 0, 0, 0, 'state/x', 'state/y'),
    (102, 'mining',      3, 'Mining',      0, 0, 0, 0, 'state/x', 'state/y'),
    (103, 'fishing',     3, 'Fishing',     0, 0, 0, 0, 'state/x', 'state/y'),
    (105, 'cooking',     3, 'Cooking',     0, 0, 0, 0, 'state/x', 'state/y')
ON DUPLICATE KEY UPDATE
    `type` = VALUES(`type`),
    `label` = VALUES(`label`),
    `skillDelay` = VALUES(`skillDelay`),
    `castTime` = VALUES(`castTime`),
    `usesLimit` = VALUES(`usesLimit`),
    `range` = VALUES(`range`),
    `rangePropertyX` = VALUES(`rangePropertyX`),
    `rangePropertyY` = VALUES(`rangePropertyY`);

-- 2) Shared profession level curve, reusing the exact anchor levels of the
--    existing class-path level sets (1/2/5/10 -> 0/100/338/2570 exp).
INSERT INTO `skills_levels_set` (`id`, `key`, `label`, `autoFillRanges`, `autoFillExperienceMultiplier`)
VALUES (100, 'professions', 'Professions', 1, NULL)
ON DUPLICATE KEY UPDATE
    `label` = VALUES(`label`),
    `autoFillRanges` = VALUES(`autoFillRanges`);

INSERT INTO `skills_levels` (`id`, `key`, `label`, `required_experience`, `level_set_id`)
SELECT v.id, v.level_key, v.level_label, v.exp, ls.id
FROM (
    SELECT 100 AS id, 1 AS level_key, '1'  AS level_label, 0    AS exp
    UNION ALL SELECT 101, 2, '2',  100
    UNION ALL SELECT 102, 5, '5',  338
    UNION ALL SELECT 103, 10, '10', 2570
) v
JOIN `skills_levels_set` ls ON ls.`key` = 'professions'
ON DUPLICATE KEY UPDATE
    `key` = VALUES(`key`),
    `label` = VALUES(`label`),
    `required_experience` = VALUES(`required_experience`),
    `level_set_id` = VALUES(`level_set_id`);

-- 3) objects_skills: link existing world objects to their profession skill.
INSERT INTO `objects_skills` (`id`, `object_id`, `skill_id`, `target_id`)
SELECT v.id, v.object_id, s.id, 2
FROM (
    SELECT 150 AS id, 207 AS object_id, 'farming'     AS skill_key
    UNION ALL SELECT 151, 208, 'farming'
    UNION ALL SELECT 152, 19,  'woodcutting'
    UNION ALL SELECT 153, 209, 'woodcutting'
    UNION ALL SELECT 154, 210, 'woodcutting'
    UNION ALL SELECT 155, 211, 'woodcutting'
    UNION ALL SELECT 156, 16,  'cooking'
    UNION ALL SELECT 157, 205, 'cooking'
) v
JOIN `skills_skill` s ON s.`key` = v.skill_key
ON DUPLICATE KEY UPDATE
    `object_id` = VALUES(`object_id`),
    `skill_id` = VALUES(`skill_id`),
    `target_id` = VALUES(`target_id`);

SET FOREIGN_KEY_CHECKS = 1;
