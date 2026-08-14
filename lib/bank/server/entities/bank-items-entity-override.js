/**
 *
 * Reldens - BankItemsEntityOverride
 *
 * Extends the bank_items entity with custom property aliases for the admin
 * panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class BankItemsEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            player_id: {type: 'reference', reference: 'users', isRequired: true, dbType: 'int'},
            item_key: {type: 'string', isRequired: true, dbType: 'varchar'},
            qty: {type: 'number', isRequired: false, dbType: 'int'}
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
        config = this.updateProperty(config, 'player_id', 'alias', 'bank_player');
        config = this.updateProperty(config, 'item_key', 'label', 'Item Key');
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

module.exports.BankItemsEntityOverride = BankItemsEntityOverride;
