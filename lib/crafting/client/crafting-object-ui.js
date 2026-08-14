/**
 *
 * Reldens - CraftingObjectUi
 *
 * Manages crafting object UI rendering and interaction on the client side.
 *
 */

const { GameConst } = require('../../game/constants');
const { OPTION_VALUE_CRAFT, SUB_ACTION_CRAFT, DATA_KEY_RECIPES } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager - CUSTOM DYNAMIC
 *
 * @typedef {Object} CraftingObjectUiProps
 * @property {RoomEvents} roomEvents
 * @property {Object} message
 */
class CraftingObjectUi
{

    /**
     * @param {CraftingObjectUiProps} props
     */
    constructor(props)
    {
        /** @type {RoomEvents|false} */
        this.roomEvents = sc.get(props, 'roomEvents', false);
        /** @type {Object|false} */
        this.message = sc.get(props, 'message', false);
        /** @type {GameManager|undefined} */
        this.gameManager = this.roomEvents?.gameManager;
        /** @type {Object|undefined} */
        this.uiScene = this.gameManager?.gameEngine?.uiScene;
        /** @type {Object|undefined} */
        this.objectUi = this.roomEvents?.objectsUi[this.message?.id];
    }

    /**
     * @returns {boolean}
     */
    validate()
    {
        if(!this.roomEvents){
            Logger.error('Missing RoomEvents on CraftingObjectUi.');
            return false;
        }
        if(!this.message){
            Logger.error('Missing message on CraftingObjectUi.');
            return false;
        }
        if(!this.gameManager){
            Logger.error('Missing GameManager on CraftingObjectUi.');
            return false;
        }
        if(!this.objectUi){
            Logger.error('Missing objectUi on CraftingObjectUi.');
            return false;
        }
        return true;
    }

    /**
     * @returns {boolean}
     */
    updateContents()
    {
        let container = this.gameManager.gameDom.getElement('#box-'+this.objectUi.id+' .box-content');
        if(!container){
            Logger.error('Missing container: "#box-'+this.objectUi.id+' .box-content".');
            return false;
        }
        let result = sc.get(this.message, 'result', false);
        if(!result){
            Logger.error('Missing result data on CraftingObjectUi message.');
            return false;
        }
        let recipes = sc.get(result, DATA_KEY_RECIPES, []);
        let craftResult = sc.get(result, 'craftResult', {});
        let output = '';
        if(craftResult?.message){
            output += '<div class="craft-result '+(craftResult.success ? 'craft-result-success' : 'craft-result-error')
                +'">'+craftResult.message+'</div>';
        }
        if(0 === recipes.length){
            output += '<div class="craft-no-recipes">No recipes available.</div>';
            container.innerHTML = output;
            return true;
        }
        for(let recipe of recipes){
            output += this.createRecipeBox(recipe);
        }
        container.innerHTML = output;
        this.activateCraftActions(recipes);
        return true;
    }

    /**
     * @param {Object} recipe
     * @returns {string}
     */
    createRecipeBox(recipe)
    {
        let ingredients = '';
        for(let ingredient of recipe.ingredients){
            let available = ingredient.owned >= ingredient.qty ? 'craft-ok' : 'craft-missing';
            ingredients += '<div class="craft-ingredient '+available+'">'
                +'<span class="craft-ingredient-label">'+ingredient.itemLabel+'</span>'
                +'<span class="craft-ingredient-qty">'+ingredient.owned+' / '+ingredient.qty+'</span>'
                +'</div>';
        }
        let results = '';
        for(let result of recipe.results){
            results += '<div class="craft-result-item">'+result.itemLabel+' x'+result.qty+'</div>';
        }
        let skillLabel = 0 < recipe.skillLevelRequired
            ? '<div class="craft-skill-required">Requires level '+recipe.skillLevelRequired+'</div>'
            : '';
        let timeLabel = 0 < recipe.timeSeconds
            ? '<div class="craft-time">Time: '+recipe.timeSeconds+'s</div>'
            : '';
        return '<div class="craft-recipe" id="craft-recipe-'+recipe.id+'">'
            +'<div class="craft-recipe-title">'+recipe.label+'</div>'
            +(recipe.description ? '<div class="craft-recipe-description">'+recipe.description+'</div>' : '')
            +skillLabel
            +timeLabel
            +'<div class="craft-ingredients">'+ingredients+'</div>'
            +'<div class="craft-results">'+results+'</div>'
            +'<button class="craft-button" data-recipe-id="'+recipe.id+'">Craft</button>'
            +'</div>';
    }

    /**
     * @param {Array<Object>} recipes
     * @returns {boolean}
     */
    activateCraftActions(recipes)
    {
        for(let recipe of recipes){
            let button = this.gameManager.gameDom.getElement(
                '#craft-recipe-'+recipe.id+' .craft-button'
            );
            if(!button){
                Logger.error('Craft button not found for recipe "'+recipe.id+'".');
                continue;
            }
            button.addEventListener('click', () => {
                this.gameManager.activeRoomEvents.send({
                    act: GameConst.BUTTON_OPTION,
                    id: this.message.id,
                    value: OPTION_VALUE_CRAFT,
                    sub: SUB_ACTION_CRAFT,
                    recipe: recipe.id
                });
            });
        }
        return true;
    }

}

module.exports.CraftingObjectUi = CraftingObjectUi;
