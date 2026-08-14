/**
 *
 * Reldens - CraftingRecipesItemsEntityOverride
 *
 * Extends the crafting_recipes_items entity with custom property aliases for
 * the admin panel.
 *
 */

const { EntityProperties } = require('@reldens/storage');

class CraftingRecipesItemsEntityOverride extends EntityProperties
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
            recipe_id: {
                type: 'reference',
                reference: 'crafting_recipes',
                isRequired: true,
                dbType: 'int'
            },
            item_id: {
                type: 'reference',
                reference: 'items_item',
                isRequired: true,
                dbType: 'int'
            },
            quantity: {
                type: 'number',
                isRequired: false,
                dbType: 'int'
            },
            type: {
                type: 'string',
                isRequired: false,
                dbType: 'varchar'
            }
        };
        let propertiesKeys = Object.keys(properties);
        let editProperties = [...propertiesKeys];
        editProperties.splice(editProperties.indexOf('id'), 1);
        let config = {
            showProperties: propertiesKeys,
            editProperties,
            listProperties: propertiesKeys,
            filterProperties: propertiesKeys,
            properties,
            ...extraProps
        };
        config = this.updateProperty(config, 'recipe_id', 'alias', 'crafting_recipe');
        config = this.updateProperty(config, 'item_id', 'alias', 'crafting_recipe_item');
        config = this.updateProperty(config, 'type', 'label', 'Type (ingredient | result)');
        return config;
    }

    /**
     * @param {Object} config
     * @param {string} propertyName
     * @param {string} propertyField
     * @param {string} propertyValue
     * @returns {Object}
     */
    static updateProperty(config, propertyName, propertyField, propertyValue)
    {
        config.properties[propertyName][propertyField] = propertyValue;
        return config;
    }

}

module.exports.CraftingRecipesItemsEntityOverride = CraftingRecipesItemsEntityOverride;
