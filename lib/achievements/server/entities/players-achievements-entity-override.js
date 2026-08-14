/**
 *
 * Reldens - PlayersAchievementsEntityOverride
 *
 * Extends the players_achievements entity with custom property aliases for the
 * admin panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class PlayersAchievementsEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            player_id: {type: 'reference', reference: 'users', isRequired: true, dbType: 'int'},
            achievement_id: {type: 'reference', reference: 'achievements', isRequired: true, dbType: 'int'},
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
        config = this.updateProperty(config, 'player_id', 'alias', 'achievement_player');
        config = this.updateProperty(config, 'achievement_id', 'alias', 'achievement');
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

module.exports.PlayersAchievementsEntityOverride = PlayersAchievementsEntityOverride;
