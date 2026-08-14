/**
 *
 * Reldens - QuestsObjectivesEntityOverride
 *
 * Extends the quests_objectives entity with custom property aliases for the
 * admin panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class QuestsObjectivesEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            quest_id: {type: 'reference', reference: 'quests', isRequired: true, dbType: 'int'},
            type: {type: 'string', isRequired: true, dbType: 'varchar'},
            target_key: {type: 'string', isRequired: true, dbType: 'varchar'},
            quantity: {type: 'number', isRequired: false, dbType: 'int'},
            label: {type: 'string', isRequired: false, dbType: 'varchar'}
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
        config = this.updateProperty(config, 'quest_id', 'alias', 'quest');
        config = this.updateProperty(config, 'type', 'label', 'Type (kill | gather | craft)');
        config = this.updateProperty(config, 'target_key', 'label', 'Target Key (item key / enemy key / recipe code)');
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

module.exports.QuestsObjectivesEntityOverride = QuestsObjectivesEntityOverride;
