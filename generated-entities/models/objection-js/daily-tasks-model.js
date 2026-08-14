/**
 *
 * Reldens - DailyTasksModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class DailyTasksModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'daily_tasks';
    }

    static get relationMappings()
    {
        const { ItemsItemModel } = require('./items-item-model');
        const { PlayersDailyTasksModel } = require('./players-daily-tasks-model');
        return {
            related_items_item: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsItemModel,
                join: {
                    from: this.tableName+'.reward_item_id',
                    to: ItemsItemModel.tableName+'.id'
                }
            },
            related_players_daily_tasks: {
                relation: this.HasManyRelation,
                modelClass: PlayersDailyTasksModel,
                join: {
                    from: this.tableName+'.id',
                    to: PlayersDailyTasksModel.tableName+'.task_id'
                }
            }
        };
    }
}

module.exports.DailyTasksModel = DailyTasksModel;
