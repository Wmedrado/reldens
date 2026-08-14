/**
 *
 * Reldens - PlayersEnergyEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class PlayersEnergyEntity extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            player_id: {
                isId: true,
                type: 'reference',
                reference: 'players',
                alias: 'related_players',
                isRequired: true,
                dbType: 'int'
            },
            last_regen_at: {
                type: 'datetime',
                isRequired: true,
                dbType: 'datetime'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = [...propertiesKeys];
        editProperties.splice(editProperties.indexOf('player_id'), 1);
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

module.exports.PlayersEnergyEntity = PlayersEnergyEntity;
