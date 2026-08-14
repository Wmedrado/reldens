--
-- Reldens - Version beta.40 - Quests feature tables
--

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `quests` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `code` varchar(64) NOT NULL,
    `label` varchar(255) NOT NULL,
    `description` text NULL,
    `object_id` int unsigned NULL,
    `reward_exp` int(11) NOT NULL DEFAULT 0,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_quests_code` (`code`),
    KEY `idx_quests_object_id` (`object_id`),
    CONSTRAINT `fk_quests_object_id` FOREIGN KEY (`object_id`) REFERENCES `objects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quests_objectives` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `quest_id` int(11) NOT NULL,
    `type` varchar(20) NOT NULL,
    `target_key` varchar(255) NOT NULL,
    `quantity` int(11) NOT NULL DEFAULT 1,
    `label` varchar(255) NULL,
    PRIMARY KEY (`id`),
    KEY `idx_quests_objectives_quest_id` (`quest_id`),
    CONSTRAINT `fk_quests_objectives_quest_id` FOREIGN KEY (`quest_id`) REFERENCES `quests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quests_rewards` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `quest_id` int(11) NOT NULL,
    `item_id` int unsigned NOT NULL,
    `quantity` int(11) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    KEY `idx_quests_rewards_quest_id` (`quest_id`),
    KEY `idx_quests_rewards_item_id` (`item_id`),
    CONSTRAINT `fk_quests_rewards_quest_id` FOREIGN KEY (`quest_id`) REFERENCES `quests` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quests_rewards_item_id` FOREIGN KEY (`item_id`) REFERENCES `items_item` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `players_quests` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `player_id` int unsigned NOT NULL,
    `quest_id` int(11) NOT NULL,
    `status` varchar(20) NOT NULL DEFAULT 'active',
    `progress` text NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_players_quests_player_quest` (`player_id`, `quest_id`),
    KEY `idx_players_quests_quest_id` (`quest_id`),
    CONSTRAINT `fk_players_quests_player_id` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_players_quests_quest_id` FOREIGN KEY (`quest_id`) REFERENCES `quests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
