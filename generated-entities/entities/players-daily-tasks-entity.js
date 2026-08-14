/**
 *
 * Reldens - PlayersDailyTasksEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class PlayersDailyTasksEntity extends EntityProperties
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
            player_id: {
                type: 'reference',
                reference: 'users',
                alias: 'related_users',
                isRequired: true,
                dbType: 'int'
            },
            task_id: {
                type: 'reference',
                reference: 'daily_tasks',
                alias: 'related_daily_tasks',
                isRequired: true,
                dbType: 'int'
            },
            task_date: {
                type: 'datetime',
                isRequired: true,
                dbType: 'date'
            },
            status: {
                dbType: 'varchar'
            },
            progress: {
                type: 'textarea',
                dbType: 'text'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = [...propertiesKeys];
        editProperties.splice(editProperties.indexOf('id'), 1);
        let listProperties = [...propertiesKeys];
        listProperties.splice(listProperties.indexOf('progress'), 1);
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

module.exports.PlayersDailyTasksEntity = PlayersDailyTasksEntity;
