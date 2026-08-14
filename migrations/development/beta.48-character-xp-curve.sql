-- ===================================================================
-- VibeCraft: character XP curve (T2.3 - personagem / XP de personagem)
-- -------------------------------------------------------------------
-- Adds a real cumulative XP curve (1-100) to all four class paths and
-- per-level stat growth. The engine already feeds this curve from
-- quests, gathering, crafting, farming, achievements and daily tasks;
-- with a real curve players now actually progress.
-- Curve: round(15 * level^2.4), level 1 = 0 XP, level 100 = 946.436 XP.
-- Stat growth per level: +2 atk, +2 def, +8 max hp, +8 max mp.
-- Tune K/P in tools/generate-character-xp-curve.js and re-run to retune.
-- ===================================================================

INSERT INTO `skills_levels` (`key`, `label`, `required_experience`, `level_set_id`)
SELECT c.lvl, c.lbl, c.xp, s.id
FROM (
    SELECT 1 AS lvl, '1' AS lbl, 0 AS xp
    UNION ALL
    SELECT 2 AS lvl, '2' AS lbl, 79 AS xp
    UNION ALL
    SELECT 3 AS lvl, '3' AS lbl, 209 AS xp
    UNION ALL
    SELECT 4 AS lvl, '4' AS lbl, 418 AS xp
    UNION ALL
    SELECT 5 AS lvl, '5' AS lbl, 714 AS xp
    UNION ALL
    SELECT 6 AS lvl, '6' AS lbl, 1106 AS xp
    UNION ALL
    SELECT 7 AS lvl, '7' AS lbl, 1601 AS xp
    UNION ALL
    SELECT 8 AS lvl, '8' AS lbl, 2206 AS xp
    UNION ALL
    SELECT 9 AS lvl, '9' AS lbl, 2926 AS xp
    UNION ALL
    SELECT 10 AS lvl, '10' AS lbl, 3768 AS xp
    UNION ALL
    SELECT 11 AS lvl, '11' AS lbl, 4736 AS xp
    UNION ALL
    SELECT 12 AS lvl, '12' AS lbl, 5836 AS xp
    UNION ALL
    SELECT 13 AS lvl, '13' AS lbl, 7072 AS xp
    UNION ALL
    SELECT 14 AS lvl, '14' AS lbl, 8449 AS xp
    UNION ALL
    SELECT 15 AS lvl, '15' AS lbl, 9970 AS xp
    UNION ALL
    SELECT 16 AS lvl, '16' AS lbl, 11641 AS xp
    UNION ALL
    SELECT 17 AS lvl, '17' AS lbl, 13464 AS xp
    UNION ALL
    SELECT 18 AS lvl, '18' AS lbl, 15443 AS xp
    UNION ALL
    SELECT 19 AS lvl, '19' AS lbl, 17583 AS xp
    UNION ALL
    SELECT 20 AS lvl, '20' AS lbl, 19887 AS xp
    UNION ALL
    SELECT 21 AS lvl, '21' AS lbl, 22357 AS xp
    UNION ALL
    SELECT 22 AS lvl, '22' AS lbl, 24998 AS xp
    UNION ALL
    SELECT 23 AS lvl, '23' AS lbl, 27812 AS xp
    UNION ALL
    SELECT 24 AS lvl, '24' AS lbl, 30803 AS xp
    UNION ALL
    SELECT 25 AS lvl, '25' AS lbl, 33974 AS xp
    UNION ALL
    SELECT 26 AS lvl, '26' AS lbl, 37327 AS xp
    UNION ALL
    SELECT 27 AS lvl, '27' AS lbl, 40866 AS xp
    UNION ALL
    SELECT 28 AS lvl, '28' AS lbl, 44593 AS xp
    UNION ALL
    SELECT 29 AS lvl, '29' AS lbl, 48512 AS xp
    UNION ALL
    SELECT 30 AS lvl, '30' AS lbl, 52624 AS xp
    UNION ALL
    SELECT 31 AS lvl, '31' AS lbl, 56932 AS xp
    UNION ALL
    SELECT 32 AS lvl, '32' AS lbl, 61440 AS xp
    UNION ALL
    SELECT 33 AS lvl, '33' AS lbl, 66149 AS xp
    UNION ALL
    SELECT 34 AS lvl, '34' AS lbl, 71063 AS xp
    UNION ALL
    SELECT 35 AS lvl, '35' AS lbl, 76182 AS xp
    UNION ALL
    SELECT 36 AS lvl, '36' AS lbl, 81511 AS xp
    UNION ALL
    SELECT 37 AS lvl, '37' AS lbl, 87051 AS xp
    UNION ALL
    SELECT 38 AS lvl, '38' AS lbl, 92805 AS xp
    UNION ALL
    SELECT 39 AS lvl, '39' AS lbl, 98775 AS xp
    UNION ALL
    SELECT 40 AS lvl, '40' AS lbl, 104963 AS xp
    UNION ALL
    SELECT 41 AS lvl, '41' AS lbl, 111371 AS xp
    UNION ALL
    SELECT 42 AS lvl, '42' AS lbl, 118002 AS xp
    UNION ALL
    SELECT 43 AS lvl, '43' AS lbl, 124858 AS xp
    UNION ALL
    SELECT 44 AS lvl, '44' AS lbl, 131940 AS xp
    UNION ALL
    SELECT 45 AS lvl, '45' AS lbl, 139252 AS xp
    UNION ALL
    SELECT 46 AS lvl, '46' AS lbl, 146795 AS xp
    UNION ALL
    SELECT 47 AS lvl, '47' AS lbl, 154570 AS xp
    UNION ALL
    SELECT 48 AS lvl, '48' AS lbl, 162581 AS xp
    UNION ALL
    SELECT 49 AS lvl, '49' AS lbl, 170829 AS xp
    UNION ALL
    SELECT 50 AS lvl, '50' AS lbl, 179316 AS xp
    UNION ALL
    SELECT 51 AS lvl, '51' AS lbl, 188044 AS xp
    UNION ALL
    SELECT 52 AS lvl, '52' AS lbl, 197015 AS xp
    UNION ALL
    SELECT 53 AS lvl, '53' AS lbl, 206231 AS xp
    UNION ALL
    SELECT 54 AS lvl, '54' AS lbl, 215693 AS xp
    UNION ALL
    SELECT 55 AS lvl, '55' AS lbl, 225404 AS xp
    UNION ALL
    SELECT 56 AS lvl, '56' AS lbl, 235365 AS xp
    UNION ALL
    SELECT 57 AS lvl, '57' AS lbl, 245579 AS xp
    UNION ALL
    SELECT 58 AS lvl, '58' AS lbl, 256046 AS xp
    UNION ALL
    SELECT 59 AS lvl, '59' AS lbl, 266769 AS xp
    UNION ALL
    SELECT 60 AS lvl, '60' AS lbl, 277750 AS xp
    UNION ALL
    SELECT 61 AS lvl, '61' AS lbl, 288990 AS xp
    UNION ALL
    SELECT 62 AS lvl, '62' AS lbl, 300491 AS xp
    UNION ALL
    SELECT 63 AS lvl, '63' AS lbl, 312254 AS xp
    UNION ALL
    SELECT 64 AS lvl, '64' AS lbl, 324282 AS xp
    UNION ALL
    SELECT 65 AS lvl, '65' AS lbl, 336576 AS xp
    UNION ALL
    SELECT 66 AS lvl, '66' AS lbl, 349138 AS xp
    UNION ALL
    SELECT 67 AS lvl, '67' AS lbl, 361969 AS xp
    UNION ALL
    SELECT 68 AS lvl, '68' AS lbl, 375070 AS xp
    UNION ALL
    SELECT 69 AS lvl, '69' AS lbl, 388445 AS xp
    UNION ALL
    SELECT 70 AS lvl, '70' AS lbl, 402093 AS xp
    UNION ALL
    SELECT 71 AS lvl, '71' AS lbl, 416017 AS xp
    UNION ALL
    SELECT 72 AS lvl, '72' AS lbl, 430219 AS xp
    UNION ALL
    SELECT 73 AS lvl, '73' AS lbl, 444699 AS xp
    UNION ALL
    SELECT 74 AS lvl, '74' AS lbl, 459460 AS xp
    UNION ALL
    SELECT 75 AS lvl, '75' AS lbl, 474502 AS xp
    UNION ALL
    SELECT 76 AS lvl, '76' AS lbl, 489828 AS xp
    UNION ALL
    SELECT 77 AS lvl, '77' AS lbl, 505439 AS xp
    UNION ALL
    SELECT 78 AS lvl, '78' AS lbl, 521337 AS xp
    UNION ALL
    SELECT 79 AS lvl, '79' AS lbl, 537522 AS xp
    UNION ALL
    SELECT 80 AS lvl, '80' AS lbl, 553997 AS xp
    UNION ALL
    SELECT 81 AS lvl, '81' AS lbl, 570762 AS xp
    UNION ALL
    SELECT 82 AS lvl, '82' AS lbl, 587820 AS xp
    UNION ALL
    SELECT 83 AS lvl, '83' AS lbl, 605172 AS xp
    UNION ALL
    SELECT 84 AS lvl, '84' AS lbl, 622819 AS xp
    UNION ALL
    SELECT 85 AS lvl, '85' AS lbl, 640762 AS xp
    UNION ALL
    SELECT 86 AS lvl, '86' AS lbl, 659003 AS xp
    UNION ALL
    SELECT 87 AS lvl, '87' AS lbl, 677544 AS xp
    UNION ALL
    SELECT 88 AS lvl, '88' AS lbl, 696385 AS xp
    UNION ALL
    SELECT 89 AS lvl, '89' AS lbl, 715529 AS xp
    UNION ALL
    SELECT 90 AS lvl, '90' AS lbl, 734976 AS xp
    UNION ALL
    SELECT 91 AS lvl, '91' AS lbl, 754728 AS xp
    UNION ALL
    SELECT 92 AS lvl, '92' AS lbl, 774786 AS xp
    UNION ALL
    SELECT 93 AS lvl, '93' AS lbl, 795152 AS xp
    UNION ALL
    SELECT 94 AS lvl, '94' AS lbl, 815827 AS xp
    UNION ALL
    SELECT 95 AS lvl, '95' AS lbl, 836812 AS xp
    UNION ALL
    SELECT 96 AS lvl, '96' AS lbl, 858109 AS xp
    UNION ALL
    SELECT 97 AS lvl, '97' AS lbl, 879718 AS xp
    UNION ALL
    SELECT 98 AS lvl, '98' AS lbl, 901641 AS xp
    UNION ALL
    SELECT 99 AS lvl, '99' AS lbl, 923880 AS xp
    UNION ALL
    SELECT 100 AS lvl, '100' AS lbl, 946436 AS xp
) c
JOIN `skills_levels_set` s ON s.id IN (1,2,3,4)
ON DUPLICATE KEY UPDATE `required_experience` = VALUES(`required_experience`);

-- replace the tiny beta.16 modifiers (scrambled level_key ids, +10 atk) so the
-- new uniform +2/+8 per-level growth applies to every level of every set:
DELETE m FROM `skills_levels_modifiers` m
JOIN `skills_levels` l ON l.id = m.level_id
WHERE l.level_set_id IN (1,2,3,4);

INSERT INTO `skills_levels_modifiers` (`level_id`, `key`, `property_key`, `operation`, `value`, `minValue`, `maxValue`, `minProperty`, `maxProperty`)
SELECT l.id, m.mod_key, m.prop, m.op, m.val, NULL, NULL, NULL, NULL
FROM (
    SELECT 1 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 1 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 1 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 1 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 2 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 2 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 2 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 2 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 3 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 3 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 3 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 3 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 4 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 4 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 4 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 4 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 5 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 5 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 5 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 5 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 6 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 6 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 6 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 6 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 7 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 7 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 7 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 7 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 8 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 8 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 8 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 8 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 9 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 9 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 9 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 9 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 10 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 10 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 10 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 10 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 11 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 11 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 11 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 11 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 12 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 12 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 12 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 12 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 13 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 13 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 13 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 13 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 14 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 14 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 14 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 14 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 15 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 15 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 15 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 15 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 16 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 16 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 16 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 16 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 17 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 17 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 17 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 17 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 18 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 18 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 18 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 18 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 19 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 19 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 19 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 19 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 20 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 20 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 20 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 20 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 21 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 21 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 21 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 21 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 22 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 22 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 22 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 22 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 23 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 23 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 23 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 23 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 24 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 24 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 24 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 24 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 25 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 25 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 25 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 25 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 26 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 26 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 26 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 26 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 27 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 27 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 27 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 27 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 28 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 28 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 28 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 28 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 29 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 29 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 29 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 29 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 30 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 30 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 30 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 30 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 31 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 31 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 31 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 31 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 32 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 32 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 32 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 32 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 33 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 33 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 33 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 33 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 34 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 34 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 34 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 34 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 35 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 35 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 35 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 35 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 36 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 36 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 36 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 36 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 37 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 37 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 37 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 37 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 38 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 38 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 38 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 38 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 39 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 39 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 39 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 39 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 40 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 40 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 40 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 40 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 41 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 41 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 41 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 41 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 42 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 42 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 42 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 42 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 43 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 43 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 43 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 43 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 44 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 44 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 44 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 44 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 45 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 45 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 45 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 45 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 46 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 46 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 46 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 46 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 47 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 47 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 47 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 47 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 48 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 48 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 48 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 48 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 49 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 49 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 49 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 49 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 50 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 50 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 50 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 50 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 51 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 51 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 51 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 51 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 52 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 52 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 52 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 52 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 53 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 53 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 53 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 53 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 54 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 54 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 54 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 54 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 55 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 55 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 55 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 55 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 56 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 56 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 56 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 56 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 57 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 57 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 57 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 57 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 58 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 58 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 58 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 58 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 59 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 59 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 59 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 59 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 60 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 60 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 60 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 60 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 61 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 61 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 61 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 61 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 62 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 62 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 62 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 62 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 63 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 63 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 63 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 63 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 64 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 64 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 64 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 64 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 65 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 65 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 65 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 65 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 66 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 66 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 66 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 66 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 67 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 67 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 67 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 67 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 68 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 68 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 68 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 68 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 69 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 69 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 69 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 69 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 70 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 70 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 70 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 70 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 71 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 71 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 71 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 71 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 72 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 72 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 72 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 72 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 73 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 73 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 73 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 73 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 74 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 74 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 74 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 74 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 75 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 75 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 75 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 75 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 76 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 76 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 76 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 76 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 77 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 77 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 77 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 77 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 78 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 78 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 78 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 78 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 79 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 79 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 79 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 79 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 80 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 80 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 80 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 80 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 81 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 81 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 81 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 81 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 82 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 82 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 82 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 82 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 83 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 83 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 83 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 83 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 84 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 84 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 84 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 84 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 85 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 85 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 85 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 85 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 86 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 86 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 86 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 86 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 87 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 87 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 87 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 87 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 88 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 88 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 88 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 88 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 89 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 89 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 89 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 89 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 90 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 90 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 90 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 90 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 91 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 91 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 91 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 91 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 92 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 92 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 92 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 92 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 93 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 93 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 93 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 93 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 94 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 94 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 94 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 94 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 95 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 95 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 95 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 95 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 96 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 96 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 96 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 96 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 97 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 97 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 97 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 97 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 98 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 98 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 98 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 98 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 99 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 99 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 99 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 99 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 100 AS lvl, 'inc_atk' AS mod_key, 'stats/atk' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 100 AS lvl, 'inc_def' AS mod_key, 'stats/def' AS prop, 1 AS op, '2' AS val
    UNION ALL
    SELECT 100 AS lvl, 'inc_hp' AS mod_key, 'statsBase/hp' AS prop, 1 AS op, '8' AS val
    UNION ALL
    SELECT 100 AS lvl, 'inc_mp' AS mod_key, 'statsBase/mp' AS prop, 1 AS op, '8' AS val
) m
JOIN `skills_levels` l ON l.`key` = m.lvl AND l.level_set_id IN (1,2,3,4)
WHERE NOT EXISTS (SELECT 1 FROM `skills_levels_modifiers` sm WHERE sm.level_id = l.id AND sm.`key` = m.mod_key);
