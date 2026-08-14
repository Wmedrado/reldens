/**
 *
 * Reldens - FarmingCropsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class FarmingCropsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'farming_crops';
    }

    static get relationMappings()
    {
        const { ItemsItemModel } = require('./items-item-model');
        const { FarmingPlotsModel } = require('./farming-plots-model');
        return {
            related_items_item_seed_item: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsItemModel,
                join: {
                    from: this.tableName+'.seed_item_id',
                    to: ItemsItemModel.tableName+'.id'
                }
            },
            related_items_item_harvest_item: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsItemModel,
                join: {
                    from: this.tableName+'.harvest_item_id',
                    to: ItemsItemModel.tableName+'.id'
                }
            },
            related_farming_plots: {
                relation: this.HasManyRelation,
                modelClass: FarmingPlotsModel,
                join: {
                    from: this.tableName+'.id',
                    to: FarmingPlotsModel.tableName+'.crop_id'
                }
            }
        };
    }
}

module.exports.FarmingCropsModel = FarmingCropsModel;
