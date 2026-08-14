/**
 *
 * Reldens - Crafting Constants
 *
 */

const TYPE_CRAFTING = 'crafting';
const OPTION_VALUE_CRAFT = 'craft';
const SUB_ACTION_LIST = 'list';
const SUB_ACTION_CRAFT = 'craft';
const ITEM_TYPE_INGREDIENT = 'ingredient';
const ITEM_TYPE_RESULT = 'result';

const SNIPPETS = {
    OBJECT: {
        TYPE_LABEL: 'Crafting',
        CONTENT: 'What would you like to craft?',
        OPTIONS: {
            CRAFT: 'Craft'
        },
        SUCCESS: 'Crafting complete!',
        ERROR: {
            RECIPE_NOT_FOUND: 'Recipe not found.',
            RECIPE_NOT_AVAILABLE: 'Recipe not available on this station.',
            INVALID_SKILL_LEVEL: 'Your level is too low to craft this.',
            MISSING_INGREDIENTS: 'You do not have the required ingredients.',
            INVENTORY_FULL: 'Your inventory is full.',
            CRAFT_FAILED: 'Could not craft the item.'
        }
    }
};

const DATA_KEY_RECIPES = 'recipes';
const DATA_KEY_RESULT = 'result';

module.exports = {
    TYPE_CRAFTING,
    OPTION_VALUE_CRAFT,
    SUB_ACTION_LIST,
    SUB_ACTION_CRAFT,
    ITEM_TYPE_INGREDIENT,
    ITEM_TYPE_RESULT,
    SNIPPETS,
    DATA_KEY_RECIPES,
    DATA_KEY_RESULT
};
