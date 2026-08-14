/**
 *
 * Reldens - GatheringResourcesEntityOverride
 *
 * Extends the gathering_resources entity with custom property aliases for the
 * admin panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class GatheringResourcesEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {isId: true, type: 'number', isRequired: true, dbType: 'int'},
            code: {type: 'string', isRequired: true, dbType: 'varchar'},
            label: {type: 'string', isRequired: true, dbType: 'varchar'},
            object_id: {type: 'reference', reference: 'objects', isRequired: true, dbType: 'int'},
            item_id: {type: 'reference', reference: 'items_item', isRequired: true, dbType: 'int'},
            experience: {type: 'number', isRequired: false, dbType: 'int'},
            difficulty: {type: 'number', isRequired: false, dbType: 'int'},
            level_requirement: {type: 'number', isRequired: false, dbType: 'int'},
            max_yields: {type: 'number', isRequired: false, dbType: 'int'},
            respawn_time: {type: 'number', isRequired: false, dbType: 'int'},
            min_qty: {type: 'number', isRequired: false, dbType: 'int'},
            max_qty: {type: 'number', isRequired: false, dbType: 'int'},
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
        config = this.updateProperty(config, 'object_id', 'alias', 'gathering_world_object');
        config = this.updateProperty(config, 'item_id', 'alias', 'gathering_yield_item');
        config = this.updateProperty(config, 'difficulty', 'label', 'Difficulty (ms per gather)');
        config = this.updateProperty(config, 'max_yields', 'label', 'Max yields before respawn');
        config = this.updateProperty(config, 'respawn_time', 'label', 'Respawn time (ms)');
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

module.exports.GatheringResourcesEntityOverride = GatheringResourcesEntityOverride;
