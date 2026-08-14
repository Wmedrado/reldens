/**
 *
 * Reldens - KnexMigrationsDevEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class KnexMigrationsDevEntity extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let titleProperty = 'name';
        let properties = {
            id: {
                isId: true,
                type: 'number',
                isRequired: true,
                dbType: 'int'
            },
            [titleProperty]: {
                dbType: 'varchar'
            },
            batch: {
                type: 'number',
                dbType: 'int'
            },
            migration_time: {
                type: 'datetime',
                dbType: 'timestamp'
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
            titleProperty,
            ...extraProps
        };
    }

}

module.exports.KnexMigrationsDevEntity = KnexMigrationsDevEntity;
