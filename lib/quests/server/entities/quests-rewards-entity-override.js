/**
 *
 * Reldens - QuestsRewardsEntityOverride
 *
 * Extends the quests_rewards entity with custom property aliases for the admin
 * panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class QuestsRewardsEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            quest_id: {type: 'reference', reference: 'quests', isRequired: true, dbType: 'int'},
            item_id: {type: 'reference', reference: 'items_item', isRequired: true, dbType: 'int'},
            quantity: {type: 'number', isRequired: false, dbType: 'int'}
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
        config = this.updateProperty(config, 'item_id', 'alias', 'quest_reward_item');
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

module.exports.QuestsRewardsEntityOverride = QuestsRewardsEntityOverride;
