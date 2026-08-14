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
const { BlockchainNftOpsEntityOverride } = require('./entities/blockchain-nft-ops-entity-override');
const { BlockchainFaucetClaimsEntityOverride } = require('./entities/blockchain-faucet-claims-entity-override');

module.exports.entitiesConfig = {
    blockchain_wallets: BlockchainWalletsEntityOverride,
    blockchain_wallet_challenges: BlockchainWalletChallengesEntityOverride,
    blockchain_nft_ops: BlockchainNftOpsEntityOverride,
    blockchain_faucet_claims: BlockchainFaucetClaimsEntityOverride
};
