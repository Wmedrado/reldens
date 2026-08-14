/**
 *
 * Reldens - QuestsEntityOverride
 *
 * Extends the quests entity with custom property aliases for the admin panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class QuestsEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            code: {type: 'string', isRequired: true, dbType: 'varchar'},
            label: {type: 'string', isRequired: true, dbType: 'varchar'},
            description: {type: 'text', isRequired: false, dbType: 'text'},
            object_id: {type: 'reference', reference: 'objects', isRequired: false, dbType: 'int'},
            reward_exp: {type: 'number', isRequired: false, dbType: 'int'},
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
        config = this.updateProperty(config, 'object_id', 'alias', 'quest_giver_object');
        config = this.updateProperty(config, 'reward_exp', 'label', 'Reward Experience');
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

module.exports.QuestsEntityOverride = QuestsEntityOverride;
