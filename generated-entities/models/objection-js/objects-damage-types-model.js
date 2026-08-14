/**
 *
 * Reldens - ObjectsDamageTypesModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class ObjectsDamageTypesModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'objects_damage_types';
    }

    static get relationMappings()
    {
        const { ObjectsModel } = require('./objects-model');
        return {
            related_objects: {
                relation: this.BelongsToOneRelation,
                modelClass: ObjectsModel,
                join: {
                    from: this.tableName+'.object_id',
                    to: ObjectsModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.ObjectsDamageTypesModel = ObjectsDamageTypesModel;
