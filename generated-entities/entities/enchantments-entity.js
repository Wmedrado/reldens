/**
 *
 * Reldens - EnchantmentsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class EnchantmentsEntity extends EntityProperties
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
            input_item_id: {
                type: 'reference',
                reference: 'items_item',
                alias: 'related_items_item_input_item',
                isRequired: true,
                dbType: 'int'
            },
            catalyst_item_id: {
                type: 'reference',
                reference: 'items_item',
                alias: 'related_items_item_catalyst_item',
                isRequired: true,
                dbType: 'int'
            },
            output_item_id: {
                type: 'reference',
                reference: 'items_item',
                alias: 'related_items_item_output_item',
                isRequired: true,
                dbType: 'int'
            },
            output_qty: {
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

module.exports.EnchantmentsEntity = EnchantmentsEntity;
