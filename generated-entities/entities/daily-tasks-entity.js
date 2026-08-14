/**
 *
 * Reldens - DailyTasksEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class DailyTasksEntity extends EntityProperties
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
            description: {
                type: 'textarea',
                dbType: 'text'
            },
            type: {
                isRequired: true,
                dbType: 'varchar'
            },
            target_key: {
                dbType: 'varchar'
            },
            quantity: {
                type: 'number',
                dbType: 'int'
            },
            reward_item_id: {
                type: 'reference',
                reference: 'items_item',
                alias: 'related_items_item',
                dbType: 'int'
            },
            reward_exp: {
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
        let listProperties = [...propertiesKeys];
        listProperties.splice(listProperties.indexOf('description'), 1);
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

module.exports.DailyTasksEntity = DailyTasksEntity;
