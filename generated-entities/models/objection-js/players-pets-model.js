/**
 *
 * Reldens - PlayersPetsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class PlayersPetsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'players_pets';
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

module.exports.PlayersPetsModel = PlayersPetsModel;
