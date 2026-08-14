/**
 *
 * Reldens - FarmingPlotsEntityOverride
 *
 * Extends the farming_plots entity with custom property aliases for the admin
 * panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class FarmingPlotsEntityOverride extends EntityProperties
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
                isRequired: true,
                dbType: 'int'
            },
            player_id: {
                type: 'reference',
                reference: 'players',
                isRequired: false,
                dbType: 'int'
            },
            crop_id: {
                type: 'reference',
                reference: 'farming_crops',
                isRequired: false,
                dbType: 'int'
            },
            planted_at: {
                type: 'datetime',
                isRequired: false,
                dbType: 'datetime'
            },
            harvests_remaining: {
                type: 'number',
                isRequired: false,
                dbType: 'int'
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
        config = this.updateProperty(config, 'object_id', 'alias', 'farming_plot_object');
        config = this.updateProperty(config, 'player_id', 'alias', 'farming_player');
        config = this.updateProperty(config, 'crop_id', 'alias', 'farming_crop');
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

module.exports.FarmingPlotsEntityOverride = FarmingPlotsEntityOverride;
