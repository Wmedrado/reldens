/**
 *
 * Reldens - ChatQuotasEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');
const { sc } = require('@reldens/utils');

class ChatQuotasEntity extends EntityProperties
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
            account_id: {
                type: 'reference',
                reference: 'users',
                alias: 'related_users',
                isRequired: true,
                dbType: 'int'
            },
            window_start: {
                type: 'datetime',
                isRequired: true,
                dbType: 'datetime'
            },
            count: {
                type: 'number',
                dbType: 'int'
            },
            max_per_window: {
                type: 'number',
                dbType: 'int'
            },
            updated_at: {
                type: 'datetime',
                dbType: 'datetime'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = sc.removeFromArray([...propertiesKeys], ['id', 'updated_at']);
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

module.exports.ChatQuotasEntity = ChatQuotasEntity;
