/**
 *
 * Reldens - AchievementsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class AchievementsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'achievements';
    }

    static get relationMappings()
    {
        const { ItemsItemModel } = require('./items-item-model');
        const { PlayersAchievementsModel } = require('./players-achievements-model');
        return {
            related_items_item: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsItemModel,
                join: {
                    from: this.tableName+'.reward_item_id',
                    to: ItemsItemModel.tableName+'.id'
                }
            },
            related_players_achievements: {
                relation: this.HasManyRelation,
                modelClass: PlayersAchievementsModel,
                join: {
                    from: this.tableName+'.id',
                    to: PlayersAchievementsModel.tableName+'.achievement_id'
                }
            }
        };
    }
}

module.exports.AchievementsModel = AchievementsModel;
