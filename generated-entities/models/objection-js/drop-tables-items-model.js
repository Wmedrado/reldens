/**
 *
 * Reldens - DropTablesItemsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class DropTablesItemsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'drop_tables_items';
    }

    static get relationMappings()
    {
        const { DropTablesModel } = require('./drop-tables-model');
        const { ItemsItemModel } = require('./items-item-model');
        return {
            related_drop_tables: {
                relation: this.BelongsToOneRelation,
                modelClass: DropTablesModel,
                join: {
                    from: this.tableName+'.drop_table_id',
                    to: DropTablesModel.tableName+'.id'
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

module.exports.DropTablesItemsModel = DropTablesItemsModel;
