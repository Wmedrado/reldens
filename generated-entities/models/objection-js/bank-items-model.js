/**
 *
 * Reldens - BankItemsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class BankItemsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'bank_items';
    }

    static get relationMappings()
    {
        const { UsersModel } = require('./users-model');
        return {
            related_users: {
                relation: this.BelongsToOneRelation,
                modelClass: UsersModel,
                join: {
                    from: this.tableName+'.player_id',
                    to: UsersModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.BankItemsModel = BankItemsModel;
