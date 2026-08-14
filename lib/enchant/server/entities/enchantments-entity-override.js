/**
 *
 * Reldens - EnchantmentsEntityOverride
 *
 * Extends the enchantments entity with custom property aliases for the admin
 * panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class EnchantmentsEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            code: {type: 'string', isRequired: true, dbType: 'varchar'},
            label: {type: 'string', isRequired: true, dbType: 'varchar'},
            input_item_id: {type: 'reference', reference: 'items_item', isRequired: true, dbType: 'int'},
            catalyst_item_id: {type: 'reference', reference: 'items_item', isRequired: true, dbType: 'int'},
            output_item_id: {type: 'reference', reference: 'items_item', isRequired: true, dbType: 'int'},
            output_qty: {type: 'number', isRequired: false, dbType: 'int'},
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
        config = this.updateProperty(config, 'input_item_id', 'alias', 'enchant_input_item');
        config = this.updateProperty(config, 'catalyst_item_id', 'alias', 'enchant_catalyst_item');
        config = this.updateProperty(config, 'output_item_id', 'alias', 'enchant_output_item');
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

module.exports.EnchantmentsEntityOverride = EnchantmentsEntityOverride;
