/**
 *
 * Reldens - ObjectsDropTablesModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class ObjectsDropTablesModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'objects_drop_tables';
    }

    static get relationMappings()
    {
        const { ObjectsModel } = require('./objects-model');
        const { DropTablesModel } = require('./drop-tables-model');
        return {
            related_objects: {
                relation: this.BelongsToOneRelation,
                modelClass: ObjectsModel,
                join: {
                    from: this.tableName+'.object_id',
                    to: ObjectsModel.tableName+'.id'
                }
            },
            related_drop_tables: {
                relation: this.BelongsToOneRelation,
                modelClass: DropTablesModel,
                join: {
                    from: this.tableName+'.drop_table_id',
                    to: DropTablesModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.ObjectsDropTablesModel = ObjectsDropTablesModel;
