/**
 *
 * Reldens - QuestsRewardsEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class QuestsRewardsEntity extends EntityProperties
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
            quest_id: {
                type: 'reference',
                reference: 'quests',
                alias: 'related_quests',
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
            quantity: {
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

module.exports.QuestsRewardsEntity = QuestsRewardsEntity;
