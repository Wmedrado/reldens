--
-- Reldens - Version beta.40 - Achievements feature tables
--

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `achievements` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `code` varchar(64) NOT NULL,
    `label` varchar(255) NOT NULL,
    `description` text NULL,
    `type` varchar(20) NOT NULL,
    `target_key` varchar(255) NULL,
    `quantity` int(11) NOT NULL DEFAULT 1,
    `reward_item_id` int unsigned NULL,
    `reward_exp` int(11) NOT NULL DEFAULT 0,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_achievements_code` (`code`),
    KEY `idx_achievements_reward_item_id` (`reward_item_id`),
    CONSTRAINT `fk_achievements_reward_item_id` FOREIGN KEY (`reward_item_id`) REFERENCES `items_item` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `players_achievements` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `player_id` int unsigned NOT NULL,
    `achievement_id` int(11) NOT NULL,
    `status` varchar(20) NOT NULL DEFAULT 'active',
    `progress` text NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_players_achievements_player_achievement` (`player_id`, `achievement_id`),
    KEY `idx_players_achievements_achievement_id` (`achievement_id`),
    CONSTRAINT `fk_players_achievements_player_id` FOREIGN KEY (`player_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_players_achievements_achievement_id` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
