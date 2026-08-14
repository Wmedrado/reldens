/**
 *
 * Reldens - KnexMigrationsDevLockEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class KnexMigrationsDevLockEntity extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let properties = {
            index: {
                isId: true,
                type: 'number',
                isRequired: true,
                dbType: 'int'
            },
            is_locked: {
                type: 'number',
                dbType: 'int'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = [...propertiesKeys];
        editProperties.splice(editProperties.indexOf('index'), 1);
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

module.exports.KnexMigrationsDevLockEntity = KnexMigrationsDevLockEntity;
