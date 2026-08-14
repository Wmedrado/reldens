--
-- Reldens - Version beta.40 - Gathering and Bank feature tables
--

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `gathering_resources` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `code` varchar(64) NOT NULL,
    `label` varchar(255) NOT NULL,
    `object_id` int unsigned NOT NULL,
    `item_id` int unsigned NOT NULL,
    `experience` int(11) NOT NULL DEFAULT 5,
    `difficulty` int(11) NOT NULL DEFAULT 2000,
    `level_requirement` int(11) NOT NULL DEFAULT 0,
    `max_yields` int(11) NOT NULL DEFAULT 3,
    `respawn_time` int(11) NOT NULL DEFAULT 30000,
    `min_qty` int(11) NOT NULL DEFAULT 1,
    `max_qty` int(11) NOT NULL DEFAULT 1,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_gathering_resources_code` (`code`),
    KEY `idx_gathering_resources_object_id` (`object_id`),
    KEY `idx_gathering_resources_item_id` (`item_id`),
    CONSTRAINT `fk_gathering_resources_object_id` FOREIGN KEY (`object_id`) REFERENCES `objects` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_gathering_resources_item_id` FOREIGN KEY (`item_id`) REFERENCES `items_item` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bank_items` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `player_id` int unsigned NOT NULL,
    `item_key` varchar(255) NOT NULL,
    `qty` int(11) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_bank_items_player_item` (`player_id`, `item_key`),
    KEY `idx_bank_items_player_id` (`player_id`),
    CONSTRAINT `fk_bank_items_player_id` FOREIGN KEY (`player_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
