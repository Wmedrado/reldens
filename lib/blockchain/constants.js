/**
 *
 * Reldens - Blockchain Constants
 *
 * Shared constants for the blockchain feature module.
 *
 */

module.exports.BlockchainConst = {
    // Challenge TTL in minutes:
    LINK_CHALLENGE_TTL_MINUTES: 10,
    // Fused ip+account wallet-link attempts per minute:
    WALLET_LINK_MAX_PER_MINUTE: 10,
    // Per-IP token balance proxy reads per minute:
    TOKEN_BALANCE_MAX_PER_MINUTE: 20,
    // Per-wallet token balance cache TTL:
    CACHE_TTL_MS: 2 * 60 * 1000,
    // Per-wallet token balance cache max entries:
    TOKEN_BALANCE_CACHE_MAX_ENTRIES: 1024,
    // Base58 alphabet (Bitcoin/Solana):
    BASE58: /^[1-9A-HJ-NP-Za-km-z]+$/,
    // Base58 decode length cap (keeps the O(n^2) decode bounded):
    MAX_BASE58_LEN: 128,
    // Reown AppKit / Wallet Connect env var for the Solana wallet app flow:
    WALLET_CONNECT_PROJECT_ID_ENV: 'RELDENS_REOWN_PROJECT_ID',
    WALLET_CONNECT_ENABLED_ENV: 'RELDENS_WALLET_CONNECT_ENABLED',
    // Economy service pass-through proxy env vars:
    ECONOMY_SERVICE_URL_ENV: 'RELDENS_ECONOMY_SERVICE_URL',
    ECONOMY_INTERNAL_SECRET_ENV: 'RELDENS_ECONOMY_INTERNAL_SECRET'
};
