/**
 *
 * Reldens - ChatQuotasModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class ChatQuotasModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'chat_quotas';
    }

    static get relationMappings()
    {
        const { UsersModel } = require('./users-model');
        return {
            related_users: {
                relation: this.BelongsToOneRelation,
                modelClass: UsersModel,
                join: {
                    from: this.tableName+'.account_id',
                    to: UsersModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.ChatQuotasModel = ChatQuotasModel;
