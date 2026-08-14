/**
 *
 * Reldens - QuestObjectUi
 *
 * Manages quest giver UI rendering and interaction on the client side.
 *
 */

const { GameConst } = require('../../game/constants');
const { OPTION_ACCEPT, OPTION_TURN_IN } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager - CUSTOM DYNAMIC
 *
 * @typedef {Object} QuestObjectUiProps
 * @property {RoomEvents} roomEvents
 * @property {Object} message
 */
class QuestObjectUi
{

    /**
     * @param {QuestObjectUiProps} props
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
        this.objectUi = this.roomEvents?.objectsUi[this.message?.id];
    }

    /**
     * @returns {boolean}
     */
    validate()
    {
        if(!this.roomEvents){
            Logger.error('Missing RoomEvents on QuestObjectUi.');
            return false;
        }
        if(!this.message){
            Logger.error('Missing message on QuestObjectUi.');
            return false;
        }
        if(!this.gameManager){
            Logger.error('Missing GameManager on QuestObjectUi.');
            return false;
        }
        if(!this.objectUi){
            Logger.error('Missing objectUi on QuestObjectUi.');
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
            Logger.error('Missing result data on QuestObjectUi message.');
            return false;
        }
        container.innerHTML = this.createQuestWindow(result);
        this.activateTurnInAction();
        return true;
    }

    /**
     * @param {Object} result
     * @returns {string}
     */
    createQuestWindow(result)
    {
        let output = '';
        let active = sc.get(result, 'active', []);
        let available = sc.get(result, 'available', []);
        if(0 < active.length){
            output += '<div class="quest-section-title">Active Quests</div>';
            for(let quest of active){
                output += this.createActiveQuestBox(quest);
            }
        }
        if(0 < available.length){
            output += '<div class="quest-section-title">Available Quests</div>';
            for(let quest of available){
                output += this.createAvailableQuestBox(quest);
            }
        }
        if(0 === active.length && 0 === available.length){
            output += '<div class="quest-empty">No quests available.</div>';
        }
        output += '<button class="quest-turn-in" data-quest-giver="'+result.questGiverId+'">Turn In</button>';
        return output;
    }

    /**
     * @param {Object} quest
     * @returns {string}
     */
    createActiveQuestBox(quest)
    {
        let objectives = '';
        for(let objective of quest.objectives){
            objectives += '<div class="quest-objective '+(objective.met ? 'quest-ok' : 'quest-missing')+'">'
                +'<span class="quest-objective-label">'+objective.label+'</span>'
                +'<span class="quest-objective-qty">'+objective.current+' / '+objective.quantity+'</span>'
                +'</div>';
        }
        let status = quest.completed ? '<div class="quest-completed">Completed</div>' : '';
        return '<div class="quest-box" id="quest-'+quest.id+'">'
            +'<div class="quest-title">'+quest.label+'</div>'
            +status
            +objectives
            +'</div>';
    }

    /**
     * @param {Object} quest
     * @returns {string}
     */
    createAvailableQuestBox(quest)
    {
        return '<div class="quest-box">'
            +'<div class="quest-title">'+quest.label+'</div>'
            +(quest.description ? '<div class="quest-description">'+quest.description+'</div>' : '')
            +'</div>';
    }

    /**
     * @returns {boolean}
     */
    activateTurnInAction()
    {
        let button = this.gameManager.gameDom.getElement('.quest-turn-in');
        if(!button){
            return false;
        }
        button.addEventListener('click', () => {
            this.gameManager.activeRoomEvents.send({
                act: GameConst.BUTTON_OPTION,
                id: this.message.id,
                value: OPTION_TURN_IN
            });
        });
        return true;
    }

}

module.exports.QuestObjectUi = QuestObjectUi;
