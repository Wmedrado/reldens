/**
 *
 * Reldens - DailyTasksEntityOverride
 *
 * Extends the daily_tasks entity with custom property aliases for the admin
 * panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class DailyTasksEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            code: {type: 'string', isRequired: true, dbType: 'varchar'},
            label: {type: 'string', isRequired: true, dbType: 'varchar'},
            description: {type: 'text', isRequired: false, dbType: 'text'},
            type: {type: 'string', isRequired: true, dbType: 'varchar'},
            target_key: {type: 'string', isRequired: false, dbType: 'varchar'},
            quantity: {type: 'number', isRequired: false, dbType: 'int'},
            reward_item_id: {type: 'reference', reference: 'items_item', isRequired: false, dbType: 'int'},
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
        config = this.updateProperty(config, 'type', 'label', 'Type (kill | gather | craft)');
        config = this.updateProperty(config, 'target_key', 'label', 'Target Key (empty = any)');
        config = this.updateProperty(config, 'reward_item_id', 'alias', 'dailytask_reward_item');
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

module.exports.DailyTasksEntityOverride = DailyTasksEntityOverride;
