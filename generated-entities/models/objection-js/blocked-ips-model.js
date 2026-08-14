/**
 *
 * Reldens - BlockedIpsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class BlockedIpsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'blocked_ips';
    }

    static get relationMappings()
    {
        const { UsersModel } = require('./users-model');
        return {
            related_users: {
                relation: this.BelongsToOneRelation,
                modelClass: UsersModel,
                join: {
                    from: this.tableName+'.created_by_user_id',
                    to: UsersModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.BlockedIpsModel = BlockedIpsModel;
