/**
 *
 * Reldens - PlayersQuestsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class PlayersQuestsEntity extends EntityProperties
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
                reference: 'players',
                alias: 'related_players',
                isRequired: true,
                dbType: 'int'
            },
            quest_id: {
                type: 'reference',
                reference: 'quests',
                alias: 'related_quests',
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

module.exports.PlayersQuestsEntity = PlayersQuestsEntity;
