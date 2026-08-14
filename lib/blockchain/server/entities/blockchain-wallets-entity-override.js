/**
 *
 * Reldens - BlockchainWalletsEntityOverride
 *
 * Extends the blockchain_wallets entity with custom property aliases for the
 * admin panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class BlockchainWalletsEntityOverride extends EntityProperties
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
            user_id: {
                type: 'reference',
                reference: 'users',
                isRequired: true,
                dbType: 'int'
            },
            pubkey: {
                type: 'string',
                isRequired: true,
                dbType: 'varchar'
            },
            linked_at: {
                type: 'datetime',
                isRequired: true,
                dbType: 'datetime'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = [...propertiesKeys];
        editProperties.splice(editProperties.indexOf('id'), 1);
        editProperties.splice(editProperties.indexOf('linked_at'), 1);
        let listProperties = propertiesKeys;
        let config = {
            showProperties,
            editProperties,
            listProperties,
            filterProperties: listProperties,
            properties,
            ...extraProps
        };
        config = this.updateProperty(config, 'user_id', 'alias', 'blockchain_wallets_user');
        config = this.updateProperty(config, 'pubkey', 'label', 'Public Key');
        config = this.updateProperty(config, 'linked_at', 'label', 'Linked At');
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

module.exports.BlockchainWalletsEntityOverride = BlockchainWalletsEntityOverride;
