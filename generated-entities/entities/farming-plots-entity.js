/**
 *
 * Reldens - FarmingPlotsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class FarmingPlotsEntity extends EntityProperties
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
            object_id: {
                type: 'reference',
                reference: 'objects',
                alias: 'related_objects',
                isRequired: true,
                dbType: 'int'
            },
            player_id: {
                type: 'reference',
                reference: 'players',
                alias: 'related_players',
                dbType: 'int'
            },
            crop_id: {
                type: 'reference',
                reference: 'farming_crops',
                alias: 'related_farming_crops',
                dbType: 'int'
            },
            planted_at: {
                type: 'datetime',
                dbType: 'datetime'
            },
            harvests_remaining: {
                type: 'number',
                dbType: 'int'
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

module.exports.FarmingPlotsEntity = FarmingPlotsEntity;
