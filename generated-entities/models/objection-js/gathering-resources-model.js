/**
 *
 * Reldens - GatheringResourcesModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class GatheringResourcesModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'gathering_resources';
    }

    static get relationMappings()
    {
        const { ObjectsModel } = require('./objects-model');
        const { ItemsItemModel } = require('./items-item-model');
        return {
            related_objects: {
                relation: this.BelongsToOneRelation,
                modelClass: ObjectsModel,
                join: {
                    from: this.tableName+'.object_id',
                    to: ObjectsModel.tableName+'.id'
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

module.exports.GatheringResourcesModel = GatheringResourcesModel;
