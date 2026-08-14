/**
 *
 * Reldens - ObjectsDamageTypesEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');
const { sc } = require('@reldens/utils');

class ObjectsDamageTypesEntity extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {
                isId: true,
                type: 'number',
                isRequired: true,
                dbType: 'int'
            },
            object_id: {
                type: 'reference',
                reference: 'objects',
                alias: 'related_objects',
                isRequired: true,
                dbType: 'int'
            },
            damage_type: {
                isRequired: true,
                dbType: 'varchar'
            },
            defense_value: {
                type: 'number',
                dbType: 'int'
            },
            multiplier: {
                type: 'number',
                dbType: 'decimal'
            },
            created_at: {
                type: 'datetime',
                dbType: 'timestamp'
            },
            updated_at: {
                type: 'datetime',
                dbType: 'timestamp'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = sc.removeFromArray([...propertiesKeys], ['id', 'created_at', 'updated_at']);
        let listProperties = propertiesKeys;
        return {
            showProperties,
            editProperties,
            listProperties,
            filterProperties: listProperties,
            properties,
            ...extraProps
        };
    }

}

module.exports.ObjectsDamageTypesEntity = ObjectsDamageTypesEntity;
