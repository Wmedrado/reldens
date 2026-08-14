/**
 *
 * Reldens - PlayersPetsEntityOverride
 *
 * Extends the players_pets entity with custom property aliases for the admin
 * panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class PlayersPetsEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            player_id: {type: 'reference', reference: 'users', isRequired: true, dbType: 'int'},
            pet_key: {type: 'string', isRequired: true, dbType: 'varchar'},
            level: {type: 'number', isRequired: false, dbType: 'int'},
            exp: {type: 'number', isRequired: false, dbType: 'int'}
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
        config = this.updateProperty(config, 'player_id', 'alias', 'pet_player');
        config = this.updateProperty(config, 'pet_key', 'label', 'Pet Key');
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

module.exports.PlayersPetsEntityOverride = PlayersPetsEntityOverride;
