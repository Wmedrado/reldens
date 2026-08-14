/**
 *
 * Reldens - BlockchainWalletChallengesModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class BlockchainWalletChallengesModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'blockchain_wallet_challenges';
    }

    static get relationMappings()
    {
        const { UsersModel } = require('./users-model');
        return {
            related_users: {
                relation: this.BelongsToOneRelation,
                modelClass: UsersModel,
                join: {
                    from: this.tableName+'.user_id',
                    to: UsersModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.BlockchainWalletChallengesModel = BlockchainWalletChallengesModel;
