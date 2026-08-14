--
-- Reldens - Profession skills (per-skill leveling)
--
-- One row per (player, skill) with an independent XP pool and level. The
-- character class level keeps working through skills_owners_class_path; this
-- adds the profession axis (farming, woodcutting, mining, fishing, foraging,
-- cooking, crafting) that gates recipes/resources.
--

CREATE TABLE IF NOT EXISTS `players_profession_skills` (
    `id` int unsigned NOT NULL AUTO_INCREMENT,
    `player_id` int unsigned NOT NULL,
    `skill_key` varchar(64) NOT NULL,
    `current_level` int unsigned NOT NULL DEFAULT 1,
    `current_exp` int unsigned NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_players_profession_skills_player_skill` (`player_id`, `skill_key`),
    KEY `idx_players_profession_skills_player` (`player_id`),
    CONSTRAINT `fk_players_profession_skills_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
