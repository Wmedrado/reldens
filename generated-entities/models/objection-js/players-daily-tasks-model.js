/**
 *
 * Reldens - PlayersDailyTasksModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class PlayersDailyTasksModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'players_daily_tasks';
    }

    static get relationMappings()
    {
        const { UsersModel } = require('./users-model');
        const { DailyTasksModel } = require('./daily-tasks-model');
        return {
            related_users: {
                relation: this.BelongsToOneRelation,
                modelClass: UsersModel,
                join: {
                    from: this.tableName+'.player_id',
                    to: UsersModel.tableName+'.id'
                }
            },
            related_daily_tasks: {
                relation: this.BelongsToOneRelation,
                modelClass: DailyTasksModel,
                join: {
                    from: this.tableName+'.task_id',
                    to: DailyTasksModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.PlayersDailyTasksModel = PlayersDailyTasksModel;
