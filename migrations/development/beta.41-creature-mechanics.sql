-- Reldens - Creature Mechanics (beta.41)
-- Inspired by the Kaetram combat design, implemented as a pattern on top of the
-- Reldens object/skill stack. Nothing here is copied Kaetram code or assets.
--
-- FASE 1  - Damage types (done in code, no schema needed): attack skills define
--           `damageType` in skills_skill.customData; the target may define
--           weakness/resistance stats (`weak_<type>` or `def_<type>`).
-- FASE 2  - Per-creature damage type profiles: signed defense values per damage
--           type (negative = weakness, positive = resistance), with optional
--           direct multiplier. Mirrors Kaetram mobs attackStats/defenseStats.
-- FASE 3  - Shared drop tables with per-object assignment and granular chance
--           (roll in 100000), mirroring Kaetram tables.json + mob dropTables.

CREATE TABLE IF NOT EXISTS `objects_damage_types` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `object_id` INT UNSIGNED NOT NULL,
    `damage_type` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `defense_value` INT SIGNED NOT NULL DEFAULT 0,
    `multiplier` DECIMAL(5,4) DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `object_id_damage_type` (`object_id`, `damage_type`) USING BTREE,
    KEY `object_id` (`object_id`) USING BTREE,
    CONSTRAINT `FK_objects_damage_types_objects`
        FOREIGN KEY (`object_id`) REFERENCES `objects` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `drop_tables` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `label` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `key` (`key`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `drop_tables_items` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `drop_table_id` INT UNSIGNED NOT NULL,
    `item_id` INT UNSIGNED NOT NULL,
    `chance` INT UNSIGNED NOT NULL DEFAULT 0,
    `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
    `min_player_level` INT UNSIGNED NOT NULL DEFAULT 0,
    `required_quest_key` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `required_quest_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `required_achievement_key` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    KEY `drop_table_id` (`drop_table_id`) USING BTREE,
    KEY `item_id` (`item_id`) USING BTREE,
    CONSTRAINT `FK_drop_tables_items_drop_tables`
        FOREIGN KEY (`drop_table_id`) REFERENCES `drop_tables` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `FK_drop_tables_items_items_item`
        FOREIGN KEY (`item_id`) REFERENCES `items_item` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `objects_drop_tables` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `object_id` INT UNSIGNED NOT NULL,
    `drop_table_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `object_id_drop_table_id` (`object_id`, `drop_table_id`) USING BTREE,
    KEY `object_id` (`object_id`) USING BTREE,
    KEY `drop_table_id` (`drop_table_id`) USING BTREE,
    CONSTRAINT `FK_objects_drop_tables_objects`
        FOREIGN KEY (`object_id`) REFERENCES `objects` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `FK_objects_drop_tables_drop_tables`
        FOREIGN KEY (`drop_table_id`) REFERENCES `drop_tables` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
