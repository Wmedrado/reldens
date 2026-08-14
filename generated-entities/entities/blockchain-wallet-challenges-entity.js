/**
 *
 * Reldens - BlockchainWalletChallengesEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class BlockchainWalletChallengesEntity extends EntityProperties
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
            nonce: {
                isRequired: true,
                dbType: 'varchar'
            },
            address: {
                isRequired: true,
                dbType: 'varchar'
            },
            message: {
                type: 'textarea',
                isRequired: true,
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
        let listProperties = [...propertiesKeys];
        listProperties.splice(listProperties.indexOf('message'), 1);
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

module.exports.BlockchainWalletChallengesEntity = BlockchainWalletChallengesEntity;
