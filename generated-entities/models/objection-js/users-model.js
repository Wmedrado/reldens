/**
 *
 * Reldens - UsersModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class UsersModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'users';
    }

    static get relationMappings()
    {
        const { BankItemsModel } = require('./bank-items-model');
        const { BlockchainFaucetClaimsModel } = require('./blockchain-faucet-claims-model');
        const { BlockchainNftOpsModel } = require('./blockchain-nft-ops-model');
        const { BlockchainWalletChallengesModel } = require('./blockchain-wallet-challenges-model');
        const { BlockchainWalletsModel } = require('./blockchain-wallets-model');
        const { BlockedIpsModel } = require('./blocked-ips-model');
        const { ChatMutesModel } = require('./chat-mutes-model');
        const { ChatQuotasModel } = require('./chat-quotas-model');
        const { PlayersModel } = require('./players-model');
        const { PlayersAchievementsModel } = require('./players-achievements-model');
        const { PlayersDailyTasksModel } = require('./players-daily-tasks-model');
        const { PlayersPetsModel } = require('./players-pets-model');
        const { UsersLocaleModel } = require('./users-locale-model');
        const { UsersLoginModel } = require('./users-login-model');
        return {
            related_bank_items: {
                relation: this.HasManyRelation,
                modelClass: BankItemsModel,
                join: {
                    from: this.tableName+'.id',
                    to: BankItemsModel.tableName+'.player_id'
                }
            },
            related_blockchain_faucet_claims: {
                relation: this.HasOneRelation,
                modelClass: BlockchainFaucetClaimsModel,
                join: {
                    from: this.tableName+'.id',
                    to: BlockchainFaucetClaimsModel.tableName+'.user_id'
                }
            },
            related_blockchain_nft_ops: {
                relation: this.HasManyRelation,
                modelClass: BlockchainNftOpsModel,
                join: {
                    from: this.tableName+'.id',
                    to: BlockchainNftOpsModel.tableName+'.user_id'
                }
            },
            related_blockchain_wallet_challenges: {
                relation: this.HasManyRelation,
                modelClass: BlockchainWalletChallengesModel,
                join: {
                    from: this.tableName+'.id',
                    to: BlockchainWalletChallengesModel.tableName+'.user_id'
                }
            },
            related_blockchain_wallets: {
                relation: this.HasOneRelation,
                modelClass: BlockchainWalletsModel,
                join: {
                    from: this.tableName+'.id',
                    to: BlockchainWalletsModel.tableName+'.user_id'
                }
            },
            related_blocked_ips: {
                relation: this.HasManyRelation,
                modelClass: BlockedIpsModel,
                join: {
                    from: this.tableName+'.id',
                    to: BlockedIpsModel.tableName+'.created_by_user_id'
                }
            },
            related_chat_mutes: {
                relation: this.HasOneRelation,
                modelClass: ChatMutesModel,
                join: {
                    from: this.tableName+'.id',
                    to: ChatMutesModel.tableName+'.account_id'
                }
            },
            related_chat_quotas: {
                relation: this.HasOneRelation,
                modelClass: ChatQuotasModel,
                join: {
                    from: this.tableName+'.id',
                    to: ChatQuotasModel.tableName+'.account_id'
                }
            },
            related_players: {
                relation: this.HasManyRelation,
                modelClass: PlayersModel,
                join: {
                    from: this.tableName+'.id',
                    to: PlayersModel.tableName+'.user_id'
                }
            },
            related_players_achievements: {
                relation: this.HasManyRelation,
                modelClass: PlayersAchievementsModel,
                join: {
                    from: this.tableName+'.id',
                    to: PlayersAchievementsModel.tableName+'.player_id'
                }
            },
            related_players_daily_tasks: {
                relation: this.HasManyRelation,
                modelClass: PlayersDailyTasksModel,
                join: {
                    from: this.tableName+'.id',
                    to: PlayersDailyTasksModel.tableName+'.player_id'
                }
            },
            related_players_pets: {
                relation: this.HasOneRelation,
                modelClass: PlayersPetsModel,
                join: {
                    from: this.tableName+'.id',
                    to: PlayersPetsModel.tableName+'.player_id'
                }
            },
            related_users_locale: {
                relation: this.HasManyRelation,
                modelClass: UsersLocaleModel,
                join: {
                    from: this.tableName+'.id',
                    to: UsersLocaleModel.tableName+'.user_id'
                }
            },
            related_users_login: {
                relation: this.HasManyRelation,
                modelClass: UsersLoginModel,
                join: {
                    from: this.tableName+'.id',
                    to: UsersLoginModel.tableName+'.user_id'
                }
            }
        };
    }
}

module.exports.UsersModel = UsersModel;
