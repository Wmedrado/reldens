# Chat moderation tables: persisted mutes/strikes and global chat quotas.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `chat_mutes` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `account_id` int(11) NOT NULL,
    `mute_until` datetime DEFAULT NULL,
    `mute_reason` varchar(500) DEFAULT NULL,
    `strikes` int(11) NOT NULL DEFAULT 0,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_chat_mutes_account_id` (`account_id`),
    CONSTRAINT `fk_chat_mutes_account_id` FOREIGN KEY (`account_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_quotas` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `account_id` int(11) NOT NULL,
    `window_start` datetime NOT NULL,
    `count` int(11) NOT NULL DEFAULT 0,
    `max_per_window` int(11) NOT NULL DEFAULT 10,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_chat_quotas_account_id` (`account_id`),
    CONSTRAINT `fk_chat_quotas_account_id` FOREIGN KEY (`account_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
