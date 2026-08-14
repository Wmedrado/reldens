/**
 *
 * Reldens - PetsEntityOverride
 *
 * Extends the pets entity with custom property aliases for the admin panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class PetsEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            key: {type: 'string', isRequired: true, dbType: 'varchar'},
            label: {type: 'string', isRequired: true, dbType: 'varchar'},
            adopt_item_id: {type: 'reference', reference: 'items_item', isRequired: true, dbType: 'int'},
            is_active: {type: 'boolean', isRequired: false, dbType: 'tinyint'}
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
        config = this.updateProperty(config, 'adopt_item_id', 'alias', 'pet_adopt_item');
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

module.exports.PetsEntityOverride = PetsEntityOverride;
