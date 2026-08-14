/**
 *
 * Reldens - CraftingRecipesItemsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class CraftingRecipesItemsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'crafting_recipes_items';
    }

    static get relationMappings()
    {
        const { CraftingRecipesModel } = require('./crafting-recipes-model');
        const { ItemsItemModel } = require('./items-item-model');
        return {
            related_crafting_recipes: {
                relation: this.BelongsToOneRelation,
                modelClass: CraftingRecipesModel,
                join: {
                    from: this.tableName+'.recipe_id',
                    to: CraftingRecipesModel.tableName+'.id'
                }
            },
            related_items_item: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsItemModel,
                join: {
                    from: this.tableName+'.item_id',
                    to: ItemsItemModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.CraftingRecipesItemsModel = CraftingRecipesItemsModel;
