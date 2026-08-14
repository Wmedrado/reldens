/**
 *
 * Reldens - BlockchainWalletsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class BlockchainWalletsEntity extends EntityProperties
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
                alias: 'related_users',
                isRequired: true,
                dbType: 'int'
            },
            pubkey: {
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
        let listProperties = propertiesKeys;
        return {
            showProperties,
            editProperties,
            listProperties,
            filterProperties: listProperties,
            properties,
            ...extraProps
        };
    }

}

module.exports.BlockchainWalletsEntity = BlockchainWalletsEntity;
