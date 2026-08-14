/**
 *
 * Reldens - BlockchainWalletsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class BlockchainWalletsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'blockchain_wallets';
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

module.exports.BlockchainWalletsModel = BlockchainWalletsModel;
