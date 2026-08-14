/**
 *
 * Reldens - CraftingObject
 *
 * Station object that lets players craft recipes. Extends the NPC object so it
 * keeps the standard interaction flow (click -> dialog box with options).
 * Recipes are stored in the "crafting_recipes" and "crafting_recipes_items"
 * tables. A recipe is available on a station when its "object_id" matches the
 * station or when it is null (global recipes, available on every station).
 *
 */

const { NpcObject } = require('../../objects/server/object/type/npc-object');
const { GameConst } = require('../../game/constants');
const {
    TYPE_CRAFTING,
    OPTION_VALUE_CRAFT,
    SUB_ACTION_LIST,
    SUB_ACTION_CRAFT,
    ITEM_TYPE_INGREDIENT,
    ITEM_TYPE_RESULT,
    SNIPPETS,
    DATA_KEY_RECIPES
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../users/server/player').Player} Player
 */
class CraftingObject extends NpcObject
{

    /**
     * @param {Object} props
     */
    constructor(props)
    {
        super(props);
        this.type = TYPE_CRAFTING;
        this.eventsPrefix = this.uid+'.crafting';
        this.clientParams.type = TYPE_CRAFTING;
        this.content = sc.get(this.clientParams, 'content', SNIPPETS.OBJECT.CONTENT);
        this.options = sc.get(this.clientParams, 'options', {
            [OPTION_VALUE_CRAFT]: {
                label: SNIPPETS.OBJECT.OPTIONS.CRAFT,
                value: OPTION_VALUE_CRAFT
            }
        });
        this.recipesById = {};
        this.dataServer = false;
    }

    /**
     * @param {Object} props
     * @returns {Promise<void>}
     */
    async runAdditionalSetup(props)
    {
        this.dataServer = sc.get(props.objectsManager, 'dataServer', false);
        if(false === this.dataServer){
            Logger.error('CraftingObject: Data Server was not specified.');
            return;
        }
        await this.loadRecipes();
    }

    /**
     * Load all the recipes available on this station into memory.
     *
     * @returns {Promise<void>}
     */
    async loadRecipes()
    {
        let recipesRepository = this.dataServer.getEntity('craftingRecipes');
        if(!recipesRepository){
            Logger.error('CraftingObject: "craftingRecipes" entity not found, run "reldens generateEntities".');
            return;
        }
        let recipesModels = await recipesRepository.loadAll();
        if(0 === recipesModels.length){
            Logger.info('CraftingObject "'+this.key+'" has no recipes.');
            return;
        }
        for(let recipe of recipesModels){
            if(!recipe.is_active){
                continue;
            }
            let isStationRecipe = null === recipe.object_id || Number(recipe.object_id) === Number(this.id);
            if(!isStationRecipe){
                continue;
            }
            let recipeItemsRepository = this.dataServer.getEntity('craftingRecipesItems');
            let recipeItemsModels = await recipeItemsRepository.loadByWithRelations(
                'recipe_id',
                recipe.id,
                ['related_items_item']
            );
            let recipeData = {
                id: recipe.id,
                code: recipe.code,
                label: recipe.label,
                description: recipe.description,
                skillId: recipe.skill_id,
                skillLevelRequired: Number(recipe.skill_level_required || 0),
                timeSeconds: Number(recipe.crafting_time_seconds || 0),
                ingredients: [],
                results: []
            };
            for(let recipeItem of recipeItemsModels){
                let item = recipeItem.related_items_item;
                if(!item){
                    Logger.error('CraftingObject: missing related item for recipe "'+recipe.code+'".');
                    continue;
                }
                let itemData = {itemKey: item.key, itemLabel: item.label, qty: Number(recipeItem.quantity)};
                if(ITEM_TYPE_RESULT === recipeItem.type){
                    recipeData.results.push(itemData);
                    continue;
                }
                recipeData.ingredients.push(itemData);
            }
            this.recipesById[recipe.id] = recipeData;
        }
    }

    /**
     * @param {Object} client
     * @param {Object} data
     * @param {Object} room
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async executeMessageActions(client, data, room, playerSchema)
    {
        let superResult = await super.executeMessageActions(client, data, room, playerSchema);
        if(false === superResult){
            return false;
        }
        let craftAction = sc.get(data, 'value', 'init');
        if(OPTION_VALUE_CRAFT !== craftAction){
            return false;
        }
        let subAction = sc.get(data, 'sub', SUB_ACTION_LIST);
        if(SUB_ACTION_CRAFT === subAction && sc.get(data, 'recipe', false)){
            return await this.doCraft(client, data, room, playerSchema);
        }
        return await this.sendCraftList(client, data, room, playerSchema);
    }

    /**
     * Send the recipe list for this station to the client.
     *
     * @param {Object} client
     * @param {Object} data
     * @param {Object} room
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async sendCraftList(client, data, room, playerSchema)
    {
        let sendData = this.craftSendData(playerSchema, {});
        client.send('*', sendData);
        return true;
    }

    /**
     * Validate ingredients and level, consume the ingredients and create the
     * recipe result on the player inventory.
     *
     * @param {Object} client
     * @param {Object} data
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async doCraft(client, data, room, playerSchema)
    {
        let recipe = sc.get(this.recipesById, data.recipe, false);
        if(false === recipe){
            return this.sendCraftResult(client, playerSchema, {success: false, message: SNIPPETS.OBJECT.ERROR.RECIPE_NOT_FOUND});
        }
        if(
            recipe.skillId
            && playerSchema.skillsServer.classPath.currentLevel < recipe.skillLevelRequired
        ){
            return this.sendCraftResult(
                client,
                playerSchema,
                {success: false, message: SNIPPETS.OBJECT.ERROR.INVALID_SKILL_LEVEL}
            );
        }
        let inventory = playerSchema.inventory.manager;
        let ingredientsByKey = this.groupIngredientsByKey(recipe.ingredients);
        let ownedByKey = this.ownedQuantityByKey(inventory, Object.keys(ingredientsByKey));
        for(let itemKey of Object.keys(ingredientsByKey)){
            if((ownedByKey[itemKey] || 0) < ingredientsByKey[itemKey].qty){
                return this.sendCraftResult(
                    client,
                    playerSchema,
                    {success: false, message: SNIPPETS.OBJECT.ERROR.MISSING_INGREDIENTS}
                );
            }
        }
        let consumeResult = await this.consumeIngredients(inventory, ingredientsByKey);
        if(false === consumeResult){
            return this.sendCraftResult(client, playerSchema, {success: false, message: SNIPPETS.OBJECT.ERROR.CRAFT_FAILED});
        }
        let produceResult = await this.produceResults(inventory, recipe.results);
        if(false === produceResult){
            return this.sendCraftResult(client, playerSchema, {success: false, message: SNIPPETS.OBJECT.ERROR.CRAFT_FAILED});
        }
        await this.events.emit('reldens.crafting.recipeCompleted', {craftingObject: this, playerSchema, recipe, room});
        return this.sendCraftResult(client, playerSchema, {success: true, message: SNIPPETS.OBJECT.SUCCESS});
    }

    /**
     * @param {Array<Object>} ingredients
     * @returns {Object<string, Object>}
     */
    groupIngredientsByKey(ingredients)
    {
        let grouped = {};
        for(let ingredient of ingredients){
            if(!sc.hasOwn(grouped, ingredient.itemKey)){
                grouped[ingredient.itemKey] = {itemKey: ingredient.itemKey, qty: 0};
            }
            grouped[ingredient.itemKey].qty += ingredient.qty;
        }
        return grouped;
    }

    /**
     * @param {Object} inventory
     * @param {Array<string>} itemKeys
     * @returns {Object<string, number>}
     */
    ownedQuantityByKey(inventory, itemKeys)
    {
        let owned = {};
        for(let i of Object.keys(inventory.items)){
            let item = inventory.items[i];
            if(-1 !== itemKeys.indexOf(item.key)){
                owned[item.key] = (owned[item.key] || 0) + item.qty;
            }
        }
        return owned;
    }

    /**
     * @param {Object} inventory
     * @param {Object<string, Object>} ingredientsByKey
     * @returns {Promise<boolean>}
     */
    async consumeIngredients(inventory, ingredientsByKey)
    {
        for(let itemKey of Object.keys(ingredientsByKey)){
            let remaining = ingredientsByKey[itemKey].qty;
            for(let i of Object.keys(inventory.items)){
                if(0 >= remaining){
                    break;
                }
                let item = inventory.items[i];
                if(item.key !== itemKey){
                    continue;
                }
                if(item.qty <= remaining){
                    remaining -= item.qty;
                    let removeResult = await inventory.removeItem(i);
                    if(false === removeResult){
                        Logger.error('CraftingObject: ingredient remove error.', inventory.lastError);
                        return false;
                    }
                    continue;
                }
                let decreaseResult = await inventory.decreaseItemQty(i, remaining);
                if(false === decreaseResult){
                    Logger.error('CraftingObject: ingredient decrease error.', inventory.lastError);
                    return false;
                }
                remaining = 0;
            }
        }
        return true;
    }

    /**
     * @param {Object} inventory
     * @param {Array<Object>} results
     * @returns {Promise<boolean>}
     */
    async produceResults(inventory, results)
    {
        for(let result of results){
            let itemInstance = inventory.createItemInstance(result.itemKey, result.qty);
            if(false === itemInstance){
                Logger.error('CraftingObject: could not create result item "'+result.itemKey+'".');
                return false;
            }
            let instances = !sc.isArray(itemInstance) ? [itemInstance] : itemInstance;
            let addResult = await inventory.addItems(instances);
            if(false === addResult){
                Logger.error('CraftingObject: could not add result item.', inventory.lastError);
                return false;
            }
        }
        return true;
    }

    /**
     * @param {Object} client
     * @param {Player} playerSchema
     * @param {Object} craftResult
     * @returns {Promise<boolean>}
     */
    async sendCraftResult(client, playerSchema, craftResult)
    {
        client.send('*', this.craftSendData(playerSchema, craftResult));
        return true;
    }

    /**
     * Build the client message with the current recipes and the player
     * inventory data so the UI can render owned quantities.
     *
     * @param {Player} playerSchema
     * @param {Object} craftResult
     * @returns {Object}
     */
    craftSendData(playerSchema, craftResult)
    {
        let recipesData = [];
        for(let recipeId of Object.keys(this.recipesById)){
            recipesData.push(this.recipeClientData(this.recipesById[recipeId], playerSchema));
        }
        return {
            act: GameConst.UI,
            id: this.id,
            result: {
                [DATA_KEY_RECIPES]: recipesData,
                craftResult
            },
            listener: 'craft'
        };
    }

    /**
     * @param {Object} recipe
     * @param {Player} playerSchema
     * @returns {Object}
     */
    recipeClientData(recipe, playerSchema)
    {
        let owned = this.ownedQuantityByKey(playerSchema.inventory.manager, recipe.ingredients.map((i) => i.itemKey));
        return {
            id: recipe.id,
            code: recipe.code,
            label: recipe.label,
            description: recipe.description,
            timeSeconds: recipe.timeSeconds,
            skillLevelRequired: recipe.skillLevelRequired,
            ingredients: recipe.ingredients.map((i) => ({
                itemKey: i.itemKey,
                itemLabel: i.itemLabel,
                qty: i.qty,
                owned: owned[i.itemKey] || 0
            })),
            results: recipe.results
        };
    }

}

module.exports.CraftingObject = CraftingObject;
