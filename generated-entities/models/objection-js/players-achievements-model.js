/**
 *
 * Reldens - PlayersAchievementsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class PlayersAchievementsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'players_achievements';
    }

    static get relationMappings()
    {
        const { UsersModel } = require('./users-model');
        const { AchievementsModel } = require('./achievements-model');
        return {
            related_users: {
                relation: this.BelongsToOneRelation,
                modelClass: UsersModel,
                join: {
                    from: this.tableName+'.player_id',
                    to: UsersModel.tableName+'.id'
                }
            },
            related_achievements: {
                relation: this.BelongsToOneRelation,
                modelClass: AchievementsModel,
                join: {
                    from: this.tableName+'.achievement_id',
                    to: AchievementsModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.PlayersAchievementsModel = PlayersAchievementsModel;
