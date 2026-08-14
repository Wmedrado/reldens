/**
 *
 * Reldens - GatheringResourcesEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class GatheringResourcesEntity extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let titleProperty = 'label';
        let properties = {
            id: {
                isId: true,
                type: 'number',
                isRequired: true,
                dbType: 'int'
            },
            code: {
                isRequired: true,
                dbType: 'varchar'
            },
            [titleProperty]: {
                isRequired: true,
                dbType: 'varchar'
            },
            object_id: {
                type: 'reference',
                reference: 'objects',
                alias: 'related_objects',
                isRequired: true,
                dbType: 'int'
            },
            item_id: {
                type: 'reference',
                reference: 'items_item',
                alias: 'related_items_item',
                isRequired: true,
                dbType: 'int'
            },
            experience: {
                type: 'number',
                dbType: 'int'
            },
            difficulty: {
                type: 'number',
                dbType: 'int'
            },
            level_requirement: {
                type: 'number',
                dbType: 'int'
            },
            max_yields: {
                type: 'number',
                dbType: 'int'
            },
            respawn_time: {
                type: 'number',
                dbType: 'int'
            },
            min_qty: {
                type: 'number',
                dbType: 'int'
            },
            max_qty: {
                type: 'number',
                dbType: 'int'
            },
            is_active: {
                type: 'boolean',
                dbType: 'tinyint'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = [...propertiesKeys];
        editProperties.splice(editProperties.indexOf('id'), 1);
        let listProperties = propertiesKeys;
        return {
            showProperties,
            editProperties,
            listProperties,
            filterProperties: listProperties,
            properties,
            titleProperty,
            ...extraProps
        };
    }

}

module.exports.GatheringResourcesEntity = GatheringResourcesEntity;
