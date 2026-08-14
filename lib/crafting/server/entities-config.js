/**
 *
 * Reldens - Entities Config
 *
 * Admin panel properties configuration for the crafting entities.
 *
 */

const { CraftingRecipesEntityOverride } = require('./entities/crafting-recipes-entity-override');
const { CraftingRecipesItemsEntityOverride } = require('./entities/crafting-recipes-items-entity-override');

module.exports.entitiesConfig = {
    craftingRecipes: CraftingRecipesEntityOverride,
    craftingRecipesItems: CraftingRecipesItemsEntityOverride
};
