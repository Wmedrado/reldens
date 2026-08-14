--
-- Reldens - Version beta.40 - Energy feature tables and configuration
--

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `players_energy` (
    `player_id` int unsigned NOT NULL,
    `last_regen_at` datetime NOT NULL,
    PRIMARY KEY (`player_id`),
    CONSTRAINT `fk_players_energy_player_id` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- energy stat:
REPLACE INTO `stats` (`id`, `key`, `label`, `description`, `base_value`, `customData`) VALUES
    (11, 'energy', 'Energy', 'Player energy points', 100, '{"showBase":true}');

-- energy stat bar (keep the existing hp/mp bars):
UPDATE `config`
SET `value` = JSON_SET(CAST(`value` AS JSON), '$.energy', JSON_OBJECT('enabled', true, 'label', 'Energy', 'activeColor', '#00c853', 'inactiveColor', '#003311'))
WHERE `scope` = 'client' AND `path` = 'players/barsProperties';

-- energy configuration:
INSERT INTO `config` (`scope`, `path`, `value`, `type`) VALUES
    ('server', 'energy/regenPerMinute', '3', 2),
    ('server', 'energy/craftingCostPerRecipe', '0', 2)
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- backfill energy stat values for existing players:
INSERT INTO `players_stats` (`player_id`, `stat_id`, `base_value`, `value`)
SELECT p.id, 11, 100, 100 FROM `players` p
WHERE NOT EXISTS (SELECT 1 FROM `players_stats` ps WHERE ps.player_id = p.id AND ps.stat_id = 11);

SET FOREIGN_KEY_CHECKS = 1;
