/**
 *
 * Reldens - EnchantmentsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class EnchantmentsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'enchantments';
    }

    static get relationMappings()
    {
        const { ItemsItemModel } = require('./items-item-model');
        return {
            related_items_item_input_item: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsItemModel,
                join: {
                    from: this.tableName+'.input_item_id',
                    to: ItemsItemModel.tableName+'.id'
                }
            },
            related_items_item_catalyst_item: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsItemModel,
                join: {
                    from: this.tableName+'.catalyst_item_id',
                    to: ItemsItemModel.tableName+'.id'
                }
            },
            related_items_item_output_item: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsItemModel,
                join: {
                    from: this.tableName+'.output_item_id',
                    to: ItemsItemModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.EnchantmentsModel = EnchantmentsModel;
