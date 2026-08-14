/**
 *
 * Reldens - DropTablesModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class DropTablesModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'drop_tables';
    }

    static get relationMappings()
    {
        const { DropTablesItemsModel } = require('./drop-tables-items-model');
        const { ObjectsDropTablesModel } = require('./objects-drop-tables-model');
        return {
            related_drop_tables_items: {
                relation: this.HasManyRelation,
                modelClass: DropTablesItemsModel,
                join: {
                    from: this.tableName+'.id',
                    to: DropTablesItemsModel.tableName+'.drop_table_id'
                }
            },
            related_objects_drop_tables: {
                relation: this.HasManyRelation,
                modelClass: ObjectsDropTablesModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsDropTablesModel.tableName+'.drop_table_id'
                }
            }
        };
    }
}

module.exports.DropTablesModel = DropTablesModel;
