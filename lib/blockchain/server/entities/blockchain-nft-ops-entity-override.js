/**
 *
 * Reldens - BlockchainNftOpsEntityOverride
 *
 * Extends the blockchain_nft_ops entity with custom property aliases for the
 * admin panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class BlockchainNftOpsEntityOverride extends EntityProperties
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
            item_key: {
                type: 'string',
                isRequired: true,
                dbType: 'varchar'
            },
            mint: {
                type: 'string',
                isRequired: true,
                dbType: 'varchar'
            },
            op: {
                type: 'string',
                isRequired: true,
                dbType: 'enum',
                availableValues: [
                    {value: 'bind', label: 'Bind'},
                    {value: 'burn', label: 'Burn'}
                ]
            },
            status: {
                type: 'string',
                isRequired: true,
                dbType: 'enum',
                availableValues: [
                    {value: 'pending', label: 'Pending'},
                    {value: 'confirmed', label: 'Confirmed'},
                    {value: 'failed', label: 'Failed'}
                ]
            },
            created_at: {
                type: 'datetime',
                isRequired: true,
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
        config = this.updateProperty(config, 'user_id', 'alias', 'blockchain_nft_ops_user');
        config = this.updateProperty(config, 'item_key', 'label', 'Item Key');
        config = this.updateProperty(config, 'mint', 'label', 'Mint Address');
        config = this.updateProperty(config, 'op', 'label', 'Operation');
        config = this.updateProperty(config, 'status', 'label', 'Status');
        config = this.updateProperty(config, 'created_at', 'label', 'Created At');
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

module.exports.BlockchainNftOpsEntityOverride = BlockchainNftOpsEntityOverride;
