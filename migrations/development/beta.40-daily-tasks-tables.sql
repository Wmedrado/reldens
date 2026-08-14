--
-- Reldens - Version beta.40 - Daily Tasks feature tables
--

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `daily_tasks` (
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
    UNIQUE KEY `uq_daily_tasks_code` (`code`),
    KEY `idx_daily_tasks_reward_item_id` (`reward_item_id`),
    CONSTRAINT `fk_daily_tasks_reward_item_id` FOREIGN KEY (`reward_item_id`) REFERENCES `items_item` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `players_daily_tasks` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `player_id` int unsigned NOT NULL,
    `task_id` int(11) NOT NULL,
    `task_date` date NOT NULL,
    `status` varchar(20) NOT NULL DEFAULT 'active',
    `progress` text NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_players_daily_tasks_player_task_date` (`player_id`, `task_id`, `task_date`),
    KEY `idx_players_daily_tasks_task_id` (`task_id`),
    CONSTRAINT `fk_players_daily_tasks_player_id` FOREIGN KEY (`player_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_players_daily_tasks_task_id` FOREIGN KEY (`task_id`) REFERENCES `daily_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
