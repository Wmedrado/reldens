# Blockchain gameplay tables:

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `blockchain_nft_ops` (
    `id` int unsigned NOT NULL AUTO_INCREMENT,
    `user_id` int unsigned NOT NULL,
    `item_key` varchar(255) NOT NULL,
    `mint` varchar(64) NOT NULL,
    `op` enum('bind','burn') NOT NULL DEFAULT 'bind',
    `status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
    `created_at` datetime NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_blockchain_nft_ops_user_id` (`user_id`),
    KEY `idx_blockchain_nft_ops_mint` (`mint`),
    CONSTRAINT `fk_blockchain_nft_ops_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `blockchain_faucet_claims` (
    `id` int unsigned NOT NULL AUTO_INCREMENT,
    `user_id` int unsigned NOT NULL,
    `last_claim_at` datetime NOT NULL,
    `created_at` datetime NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_blockchain_faucet_claims_user_id` (`user_id`),
    KEY `idx_blockchain_faucet_claims_user_id` (`user_id`),
    CONSTRAINT `fk_blockchain_faucet_claims_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
