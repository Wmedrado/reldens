/**
 *
 * Reldens - BlockchainNftOpsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');
const { sc } = require('@reldens/utils');

class BlockchainNftOpsEntity extends EntityProperties
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
            item_key: {
                isRequired: true,
                dbType: 'varchar'
            },
            mint: {
                isRequired: true,
                dbType: 'varchar'
            },
            op: {
                availableValues: [
                    {value: 1, label: 'bind'},
                    {value: 2, label: 'burn'}
                ],
                dbType: 'enum'
            },
            status: {
                availableValues: [
                    {value: 1, label: 'pending'},
                    {value: 2, label: 'confirmed'},
                    {value: 3, label: 'failed'}
                ],
                dbType: 'enum'
            },
            created_at: {
                type: 'datetime',
                isRequired: true,
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

module.exports.BlockchainNftOpsEntity = BlockchainNftOpsEntity;
