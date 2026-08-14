--
-- Reldens - Version beta.40 - Crafting feature tables
--

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `crafting_recipes` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `code` varchar(64) NOT NULL,
    `label` varchar(255) NOT NULL,
    `description` text NULL,
    `object_id` int unsigned NULL,
    `skill_id` int unsigned NULL,
    `skill_level_required` int(11) NOT NULL DEFAULT 0,
    `crafting_time_seconds` int(11) NOT NULL DEFAULT 0,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_crafting_recipes_code` (`code`),
    KEY `idx_crafting_recipes_object_id` (`object_id`),
    KEY `idx_crafting_recipes_skill_id` (`skill_id`),
    CONSTRAINT `fk_crafting_recipes_object_id` FOREIGN KEY (`object_id`) REFERENCES `objects` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_crafting_recipes_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crafting_recipes_items` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `recipe_id` int(11) NOT NULL,
    `item_id` int unsigned NOT NULL,
    `quantity` int(11) NOT NULL DEFAULT 1,
    `type` varchar(20) NOT NULL DEFAULT 'ingredient',
    PRIMARY KEY (`id`),
    KEY `idx_crafting_recipes_items_recipe_id` (`recipe_id`),
    KEY `idx_crafting_recipes_items_item_id` (`item_id`),
    CONSTRAINT `fk_crafting_recipes_items_recipe_id` FOREIGN KEY (`recipe_id`) REFERENCES `crafting_recipes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_crafting_recipes_items_item_id` FOREIGN KEY (`item_id`) REFERENCES `items_item` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
