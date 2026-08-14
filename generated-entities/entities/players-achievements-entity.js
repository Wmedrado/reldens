/**
 *
 * Reldens - PlayersAchievementsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class PlayersAchievementsEntity extends EntityProperties
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
            achievement_id: {
                type: 'reference',
                reference: 'achievements',
                alias: 'related_achievements',
                isRequired: true,
                dbType: 'int'
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

module.exports.PlayersAchievementsEntity = PlayersAchievementsEntity;
