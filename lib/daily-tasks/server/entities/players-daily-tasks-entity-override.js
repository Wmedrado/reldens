/**
 *
 * Reldens - PlayersDailyTasksEntityOverride
 *
 * Extends the players_daily_tasks entity with custom property aliases for the
 * admin panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class PlayersDailyTasksEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            player_id: {type: 'reference', reference: 'users', isRequired: true, dbType: 'int'},
            task_id: {type: 'reference', reference: 'daily_tasks', isRequired: true, dbType: 'int'},
            task_date: {type: 'date', isRequired: true, dbType: 'date'},
            status: {type: 'string', isRequired: false, dbType: 'varchar'},
            progress: {type: 'text', isRequired: false, dbType: 'text'}
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
        config = this.updateProperty(config, 'player_id', 'alias', 'dailytask_player');
        config = this.updateProperty(config, 'task_id', 'alias', 'dailytask_task');
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

module.exports.PlayersDailyTasksEntityOverride = PlayersDailyTasksEntityOverride;
