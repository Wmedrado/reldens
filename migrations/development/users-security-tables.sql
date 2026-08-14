--
-- Reldens - Users security tables (IP blocklist + TOTP 2FA columns)
--

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `blocked_ips` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `ip` varchar(45) NOT NULL,
    `reason` varchar(500) NULL,
    `created_by_user_id` int(11) UNSIGNED NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` datetime NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_blocked_ips_ip` (`ip`),
    KEY `idx_blocked_ips_created_by_user_id` (`created_by_user_id`),
    CONSTRAINT `fk_blocked_ips_created_by_user_id` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users`
    ADD COLUMN `totp_secret` VARCHAR(32) NULL AFTER `login_count`,
    ADD COLUMN `totp_enabled` TINYINT(1) NOT NULL DEFAULT 0 AFTER `totp_secret`;

SET FOREIGN_KEY_CHECKS = 1;
