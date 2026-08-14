--
-- Reldens - Version beta.40 - Enchant and Pets feature tables
--

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `enchantments` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `code` varchar(64) NOT NULL,
    `label` varchar(255) NOT NULL,
    `input_item_id` int unsigned NOT NULL,
    `catalyst_item_id` int unsigned NOT NULL,
    `output_item_id` int unsigned NOT NULL,
    `output_qty` int(11) NOT NULL DEFAULT 1,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_enchantments_code` (`code`),
    KEY `idx_enchantments_input_item_id` (`input_item_id`),
    KEY `idx_enchantments_catalyst_item_id` (`catalyst_item_id`),
    KEY `idx_enchantments_output_item_id` (`output_item_id`),
    CONSTRAINT `fk_enchantments_input_item_id` FOREIGN KEY (`input_item_id`) REFERENCES `items_item` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_enchantments_catalyst_item_id` FOREIGN KEY (`catalyst_item_id`) REFERENCES `items_item` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_enchantments_output_item_id` FOREIGN KEY (`output_item_id`) REFERENCES `items_item` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pets` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `key` varchar(64) NOT NULL,
    `label` varchar(255) NOT NULL,
    `adopt_item_id` int unsigned NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_pets_key` (`key`),
    KEY `idx_pets_adopt_item_id` (`adopt_item_id`),
    CONSTRAINT `fk_pets_adopt_item_id` FOREIGN KEY (`adopt_item_id`) REFERENCES `items_item` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `players_pets` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `player_id` int unsigned NOT NULL,
    `pet_key` varchar(64) NOT NULL,
    `level` int(11) NOT NULL DEFAULT 1,
    `exp` int(11) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_players_pets_player_id` (`player_id`),
    CONSTRAINT `fk_players_pets_player_id` FOREIGN KEY (`player_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
