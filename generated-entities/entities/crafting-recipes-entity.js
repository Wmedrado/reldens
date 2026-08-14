/**
 *
 * Reldens - CraftingRecipesEntity
 *
 */

const { EntityProperties } = require('@reldens/storage');

class CraftingRecipesEntity extends EntityProperties
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
            code: {
                isRequired: true,
                dbType: 'varchar'
            },
            [titleProperty]: {
                isRequired: true,
                dbType: 'varchar'
            },
            description: {
                type: 'textarea',
                dbType: 'text'
            },
            object_id: {
                type: 'reference',
                reference: 'objects',
                alias: 'related_objects',
                dbType: 'int'
            },
            skill_id: {
                type: 'reference',
                reference: 'skills_skill',
                alias: 'related_skills_skill',
                dbType: 'int'
            },
            skill_level_required: {
                type: 'number',
                dbType: 'int'
            },
            crafting_time_seconds: {
                type: 'number',
                dbType: 'int'
            },
            is_active: {
                type: 'boolean',
                dbType: 'tinyint'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let showProperties = propertiesKeys;
        let editProperties = [...propertiesKeys];
        editProperties.splice(editProperties.indexOf('id'), 1);
        let listProperties = [...propertiesKeys];
        listProperties.splice(listProperties.indexOf('description'), 1);
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

module.exports.CraftingRecipesEntity = CraftingRecipesEntity;
