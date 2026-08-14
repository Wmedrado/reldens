/**
 *
 * Reldens - BlockchainNftOpsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class BlockchainNftOpsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'blockchain_nft_ops';
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

module.exports.BlockchainNftOpsModel = BlockchainNftOpsModel;
