/**
 *
 * Reldens - Entities Config
 *
 * Admin panel properties configuration for the blockchain entities.
 *
 */

const { BlockchainWalletsEntityOverride } = require('./entities/blockchain-wallets-entity-override');
const { BlockchainWalletChallengesEntityOverride } = require(
    './entities/blockchain-wallet-challenges-entity-override'
);

module.exports.entitiesConfig = {
    blockchain_wallets: BlockchainWalletsEntityOverride,
    blockchain_wallet_challenges: BlockchainWalletChallengesEntityOverride
};
