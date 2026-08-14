/**
 *
 * Reldens - BlockchainWalletChallengesEntityOverride
 *
 * Extends the blockchain_wallet_challenges entity with custom property
 * aliases for the admin panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class BlockchainWalletChallengesEntityOverride extends EntityProperties
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
            nonce: {
                type: 'string',
                isRequired: true,
                dbType: 'varchar'
            },
            address: {
                type: 'string',
                isRequired: true,
                dbType: 'varchar'
            },
            message: {
                type: 'string',
                dbType: 'text'
            },
            expires_at: {
                type: 'datetime',
                isRequired: true,
                dbType: 'datetime'
            },
            consumed: {
                type: 'boolean',
                dbType: 'tinyint'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = [...propertiesKeys];
        editProperties.splice(editProperties.indexOf('id'), 1);
        editProperties.splice(editProperties.indexOf('nonce'), 1);
        editProperties.splice(editProperties.indexOf('message'), 1);
        editProperties.splice(editProperties.indexOf('consumed'), 1);
        let listProperties = propertiesKeys;
        let config = {
            showProperties,
            editProperties,
            listProperties,
            filterProperties: listProperties,
            properties,
            ...extraProps
        };
        config = this.updateProperty(config, 'user_id', 'alias', 'blockchain_challenges_user');
        config = this.updateProperty(config, 'address', 'label', 'Wallet Address');
        config = this.updateProperty(config, 'expires_at', 'label', 'Expires At');
        config = this.updateProperty(config, 'consumed', 'label', 'Consumed');
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

module.exports.BlockchainWalletChallengesEntityOverride = BlockchainWalletChallengesEntityOverride;
