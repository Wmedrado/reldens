--
-- Reldens - Version beta.40 - Farming feature tables
--

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `farming_crops` (
    `id` int unsigned NOT NULL AUTO_INCREMENT,
    `key` varchar(255) NOT NULL,
    `label` varchar(255) NOT NULL,
    `description` text NULL,
    `seed_item_id` int unsigned NOT NULL,
    `harvest_item_id` int unsigned NOT NULL,
    `growth_time_seconds` int unsigned NOT NULL DEFAULT 60,
    `exp_reward` int unsigned NOT NULL DEFAULT 0,
    `energy_cost` int unsigned NOT NULL DEFAULT 1,
    `harvests` int unsigned NOT NULL DEFAULT 1,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_farming_crops_key` (`key`),
    CONSTRAINT `fk_farming_crops_seed_item` FOREIGN KEY (`seed_item_id`) REFERENCES `items_item` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_farming_crops_harvest_item` FOREIGN KEY (`harvest_item_id`) REFERENCES `items_item` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `farming_plots` (
    `id` int unsigned NOT NULL AUTO_INCREMENT,
    `object_id` int unsigned NOT NULL,
    `player_id` int unsigned NULL,
    `crop_id` int unsigned NULL,
    `planted_at` datetime NULL,
    `harvests_remaining` int unsigned NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_farming_plots_object` (`object_id`),
    CONSTRAINT `fk_farming_plots_object_id` FOREIGN KEY (`object_id`) REFERENCES `objects` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_farming_plots_player_id` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_farming_plots_crop_id` FOREIGN KEY (`crop_id`) REFERENCES `farming_crops` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
