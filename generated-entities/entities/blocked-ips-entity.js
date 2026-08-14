/**
 *
 * Reldens - BlockedIpsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');
const { sc } = require('@reldens/utils');

class BlockedIpsEntity extends EntityProperties
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
                isRequired: true,
                dbType: 'varchar'
            },
            reason: {
                dbType: 'varchar'
            },
            created_by_user_id: {
                type: 'reference',
                reference: 'users',
                alias: 'related_users',
                dbType: 'int'
            },
            created_at: {
                type: 'datetime',
                dbType: 'timestamp'
            },
            expires_at: {
                type: 'datetime',
                dbType: 'datetime'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = sc.removeFromArray([...propertiesKeys], ['id', 'created_at']);
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

module.exports.BlockedIpsEntity = BlockedIpsEntity;
