/**
 *
 * Reldens - DropTablesItemsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');
const { sc } = require('@reldens/utils');

class DropTablesItemsEntity extends EntityProperties
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
            drop_table_id: {
                type: 'reference',
                reference: 'drop_tables',
                alias: 'related_drop_tables',
                isRequired: true,
                dbType: 'int'
            },
            item_id: {
                type: 'reference',
                reference: 'items_item',
                alias: 'related_items_item',
                isRequired: true,
                dbType: 'int'
            },
            chance: {
                type: 'number',
                dbType: 'int'
            },
            quantity: {
                type: 'number',
                dbType: 'int'
            },
            min_player_level: {
                type: 'number',
                dbType: 'int'
            },
            required_quest_key: {
                dbType: 'varchar'
            },
            required_quest_status: {
                dbType: 'varchar'
            },
            required_achievement_key: {
                dbType: 'varchar'
            },
            created_at: {
                type: 'datetime',
                dbType: 'timestamp'
            },
            updated_at: {
                type: 'datetime',
                dbType: 'timestamp'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = sc.removeFromArray([...propertiesKeys], ['id', 'created_at', 'updated_at']);
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

module.exports.DropTablesItemsEntity = DropTablesItemsEntity;
