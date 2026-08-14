/**
 *
 * Reldens - BlockedIpsEntityOverride
 *
 * Extends the blocked_ips entity with custom property aliases for the admin
 * panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class BlockedIpsEntityOverride extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            id: {
                isId: true,
                type: 'number',
                isRequired: true,
                dbType: 'int'
            },
            ip: {
                type: 'string',
                isRequired: true,
                dbType: 'varchar'
            },
            reason: {
                type: 'string',
                dbType: 'varchar'
            },
            created_by_user_id: {
                type: 'reference',
                reference: 'users',
                dbType: 'int'
            },
            created_at: {
                type: 'datetime',
                isRequired: true,
                dbType: 'timestamp'
            },
            expires_at: {
                type: 'datetime',
                dbType: 'datetime'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = [...propertiesKeys];
        editProperties.splice(editProperties.indexOf('id'), 1);
        editProperties.splice(editProperties.indexOf('created_at'), 1);
        let listProperties = propertiesKeys;
        let config = {
            showProperties,
            editProperties,
            listProperties,
            filterProperties: listProperties,
            properties,
            ...extraProps
        };
        config = this.updateProperty(config, 'ip', 'label', 'IP Address');
        config = this.updateProperty(config, 'reason', 'label', 'Reason');
        config = this.updateProperty(config, 'created_by_user_id', 'alias', 'blocked_ips_created_by');
        config = this.updateProperty(config, 'created_at', 'label', 'Created At');
        config = this.updateProperty(config, 'expires_at', 'label', 'Expires At');
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

module.exports.BlockedIpsEntityOverride = BlockedIpsEntityOverride;
