/**
 *
 * Reldens - PetsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class PetsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'pets';
    }

    static get relationMappings()
    {
        const { ItemsItemModel } = require('./items-item-model');
        return {
            related_items_item: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsItemModel,
                join: {
                    from: this.tableName+'.adopt_item_id',
                    to: ItemsItemModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.PetsModel = PetsModel;
