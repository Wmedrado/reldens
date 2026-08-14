/**
 *
 * Reldens - QuestsObjectivesEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class QuestsObjectivesEntity extends EntityProperties
{

    static propertiesConfig(extraProps)
    {
        let titleProperty = 'label';
        let properties = {
            id: {
                isId: true,
                type: 'number',
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
            type: {
                isRequired: true,
                dbType: 'varchar'
            },
            target_key: {
                isRequired: true,
                dbType: 'varchar'
            },
            quantity: {
                type: 'number',
                dbType: 'int'
            },
            [titleProperty]: {
                dbType: 'varchar'
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

module.exports.QuestsObjectivesEntity = QuestsObjectivesEntity;
