/**
 *
 * Reldens - BlockchainFaucetClaimsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class BlockchainFaucetClaimsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'blockchain_faucet_claims';
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

module.exports.BlockchainFaucetClaimsModel = BlockchainFaucetClaimsModel;
