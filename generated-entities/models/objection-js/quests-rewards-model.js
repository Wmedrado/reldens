/**
 *
 * Reldens - QuestsRewardsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class QuestsRewardsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'quests_rewards';
    }

    static get relationMappings()
    {
        const { QuestsModel } = require('./quests-model');
        const { ItemsItemModel } = require('./items-item-model');
        return {
            related_quests: {
                relation: this.BelongsToOneRelation,
                modelClass: QuestsModel,
                join: {
                    from: this.tableName+'.quest_id',
                    to: QuestsModel.tableName+'.id'
                }
            },
            related_items_item: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsItemModel,
                join: {
                    from: this.tableName+'.item_id',
                    to: ItemsItemModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.QuestsRewardsModel = QuestsRewardsModel;
