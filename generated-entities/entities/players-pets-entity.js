/**
 *
 * Reldens - PlayersPetsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class PlayersPetsEntity extends EntityProperties
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
            pet_key: {
                isRequired: true,
                dbType: 'varchar'
            },
            level: {
                type: 'number',
                dbType: 'int'
            },
            exp: {
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

module.exports.PlayersPetsEntity = PlayersPetsEntity;
