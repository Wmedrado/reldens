/**
 *
 * Reldens - FarmingCropsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class FarmingCropsEntity extends EntityProperties
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
            key: {
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
            seed_item_id: {
                type: 'reference',
                reference: 'items_item',
                alias: 'related_items_item_seed_item',
                isRequired: true,
                dbType: 'int'
            },
            harvest_item_id: {
                type: 'reference',
                reference: 'items_item',
                alias: 'related_items_item_harvest_item',
                isRequired: true,
                dbType: 'int'
            },
            growth_time_seconds: {
                type: 'number',
                dbType: 'int'
            },
            exp_reward: {
                type: 'number',
                dbType: 'int'
            },
            energy_cost: {
                type: 'number',
                dbType: 'int'
            },
            harvests: {
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

module.exports.FarmingCropsEntity = FarmingCropsEntity;
