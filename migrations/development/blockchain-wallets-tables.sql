# Blockchain feature tables:

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `blockchain_wallets` (
    `id` int unsigned NOT NULL AUTO_INCREMENT,
    `user_id` int unsigned NOT NULL,
    `pubkey` varchar(44) NOT NULL,
    `linked_at` datetime NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_blockchain_wallets_user_id` (`user_id`),
    UNIQUE KEY `uq_blockchain_wallets_pubkey` (`pubkey`),
    KEY `idx_blockchain_wallets_user_id` (`user_id`),
    KEY `idx_blockchain_wallets_pubkey` (`pubkey`),
    CONSTRAINT `fk_blockchain_wallets_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `blockchain_wallet_challenges` (
    `id` int unsigned NOT NULL AUTO_INCREMENT,
    `user_id` int unsigned NOT NULL,
    `nonce` varchar(64) NOT NULL,
    `address` varchar(44) NOT NULL,
    `message` text NOT NULL,
    `expires_at` datetime NOT NULL,
    `consumed` tinyint(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_blockchain_wallet_challenges_nonce` (`nonce`),
    KEY `idx_blockchain_wallet_challenges_user_id` (`user_id`),
    KEY `idx_blockchain_wallet_challenges_nonce` (`nonce`),
    CONSTRAINT `fk_blockchain_wallet_challenges_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
