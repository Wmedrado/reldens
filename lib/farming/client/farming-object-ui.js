/**
 *
 * Reldens - FarmingObjectUi
 *
 * Manages farming object UI rendering and interaction on the client side.
 *
 */

const { GameConst } = require('../../game/constants');
const {
    OPTION_PLANT,
    OPTION_HARVEST,
    PLOT_STATE_EMPTY,
    PLOT_STATE_PLANTED,
    PLOT_STATE_READY
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager - CUSTOM DYNAMIC
 *
 * @typedef {Object} FarmingObjectUiProps
 * @property {RoomEvents} roomEvents
 * @property {Object} message
 */
class FarmingObjectUi
{

    /**
     * @param {FarmingObjectUiProps} props
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
            Logger.error('Missing RoomEvents on FarmingObjectUi.');
            return false;
        }
        if(!this.message){
            Logger.error('Missing message on FarmingObjectUi.');
            return false;
        }
        if(!this.gameManager){
            Logger.error('Missing GameManager on FarmingObjectUi.');
            return false;
        }
        if(!this.objectUi){
            Logger.error('Missing objectUi on FarmingObjectUi.');
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
            Logger.error('Missing result data on FarmingObjectUi message.');
            return false;
        }
        let state = sc.get(result, 'state', PLOT_STATE_EMPTY);
        let remainingSeconds = sc.get(result, 'remainingSeconds', 0);
        let crop = sc.get(result, 'crop', false);
        let crops = sc.get(result, 'crops', []);
        let actionResult = sc.get(result, 'result', {});
        let output = '';
        if(actionResult?.message){
            output += '<div class="farm-result '+(actionResult.success ? 'farm-result-success' : 'farm-result-error')
                +'">'+actionResult.message+'</div>';
        }
        output += '<div class="farm-state">'+this.stateLabel(state, crop, remainingSeconds)+'</div>';
        if(PLOT_STATE_EMPTY === state){
            output += this.renderCrops(crops);
        } else {
            output += this.renderHarvestButton();
        }
        container.innerHTML = output;
        this.activateActions(crops);
        return true;
    }

    /**
     * @param {string} state
     * @param {Object|boolean} crop
     * @param {number} remainingSeconds
     * @returns {string}
     */
    stateLabel(state, crop, remainingSeconds)
    {
        if(PLOT_STATE_PLANTED === state){
            return 'Growing: '+crop?.label+' ('+Math.ceil(remainingSeconds)+'s left)';
        }
        if(PLOT_STATE_READY === state){
            return 'Ready to harvest: '+crop?.label;
        }
        return 'Empty plot';
    }

    /**
     * @param {Array<Object>} crops
     * @returns {string}
     */
    renderCrops(crops)
    {
        if(0 === crops.length){
            return '<div class="farm-no-crops">No crops available.</div>';
        }
        let output = '';
        for(let crop of crops){
            output += '<div class="farm-crop" id="farm-crop-'+crop.id+'">'
                +'<div class="farm-crop-title">'+crop.label+'</div>'
                +(crop.description ? '<div class="farm-crop-description">'+crop.description+'</div>' : '')
                +'<div class="farm-crop-seed">Seed: '+crop.seedItemLabel+' (owned: '+crop.ownedSeed+')</div>'
                +'<div class="farm-crop-growth">Growth: '+crop.growthTimeSeconds+'s</div>'
                +'<div class="farm-crop-energy">Energy: '+crop.energyCost+'</div>'
                +'<button class="farm-plant-button" data-crop-id="'+crop.id+'">Plant</button>'
                +'</div>';
        }
        return output;
    }

    /**
     * @returns {string}
     */
    renderHarvestButton()
    {
        return '<button class="farm-harvest-button">Harvest</button>';
    }

    /**
     * @param {Array<Object>} crops
     * @returns {boolean}
     */
    activateActions(crops)
    {
        for(let crop of crops){
            let button = this.gameManager.gameDom.getElement('#farm-crop-'+crop.id+' .farm-plant-button');
            if(!button){
                continue;
            }
            button.addEventListener('click', () => {
                this.gameManager.activeRoomEvents.send({
                    act: GameConst.BUTTON_OPTION,
                    id: this.message.id,
                    value: OPTION_PLANT,
                    crop: crop.key
                });
            });
        }
        let harvestButton = this.gameManager.gameDom.getElement(
            '#box-'+this.objectUi.id+' .farm-harvest-button'
        );
        if(harvestButton){
            harvestButton.addEventListener('click', () => {
                this.gameManager.activeRoomEvents.send({
                    act: GameConst.BUTTON_OPTION,
                    id: this.message.id,
                    value: OPTION_HARVEST
                });
            });
        }
        return true;
    }

}

module.exports.FarmingObjectUi = FarmingObjectUi;
