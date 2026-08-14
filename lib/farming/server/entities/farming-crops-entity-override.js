/**
 *
 * Reldens - FarmingCropsEntityOverride
 *
 * Extends the farming_crops entity with custom property aliases for the admin
 * panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class FarmingCropsEntityOverride extends EntityProperties
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
            key: {
                type: 'string',
                isRequired: true,
                dbType: 'varchar'
            },
            label: {
                type: 'string',
                isRequired: true,
                dbType: 'varchar'
            },
            description: {
                type: 'text',
                isRequired: false,
                dbType: 'text'
            },
            seed_item_id: {
                type: 'reference',
                reference: 'items_item',
                isRequired: true,
                dbType: 'int'
            },
            harvest_item_id: {
                type: 'reference',
                reference: 'items_item',
                isRequired: true,
                dbType: 'int'
            },
            growth_time_seconds: {
                type: 'number',
                isRequired: false,
                dbType: 'int'
            },
            exp_reward: {
                type: 'number',
                isRequired: false,
                dbType: 'int'
            },
            energy_cost: {
                type: 'number',
                isRequired: false,
                dbType: 'int'
            },
            harvests: {
                type: 'number',
                isRequired: false,
                dbType: 'int'
            },
            is_active: {
                type: 'boolean',
                isRequired: false,
                dbType: 'tinyint'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let editProperties = [...propertiesKeys];
        editProperties.splice(editProperties.indexOf('id'), 1);
        let config = {
            showProperties: propertiesKeys,
            editProperties,
            listProperties: propertiesKeys,
            filterProperties: propertiesKeys,
            properties,
            ...extraProps
        };
        config = this.updateProperty(config, 'seed_item_id', 'alias', 'farming_seed_item');
        config = this.updateProperty(config, 'harvest_item_id', 'alias', 'farming_harvest_item');
        return config;
    }

    /**
     * @param {Object} config
     * @param {string} propertyName
     * @param {string} propertyField
     * @param {string} propertyValue
     * @returns {Object}
     */
    static updateProperty(config, propertyName, propertyField, propertyValue)
    {
        config.properties[propertyName][propertyField] = propertyValue;
        return config;
    }

}

module.exports.FarmingCropsEntityOverride = FarmingCropsEntityOverride;
