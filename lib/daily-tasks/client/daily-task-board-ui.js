/**
 *
 * Reldens - DailyTaskBoardUi
 *
 * Renders the daily tasks list with progress and claim buttons.
 *
 */

const { ACTION_CLAIM } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager - CUSTOM DYNAMIC
 *
 * @typedef {Object} DailyTaskBoardUiProps
 * @property {RoomEvents} roomEvents
 * @property {Object} message
 */
class DailyTaskBoardUi
{

    /**
     * @param {DailyTaskBoardUiProps} props
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
            Logger.error('Missing RoomEvents on DailyTaskBoardUi.');
            return false;
        }
        if(!this.message){
            Logger.error('Missing message on DailyTaskBoardUi.');
            return false;
        }
        if(!this.gameManager){
            Logger.error('Missing GameManager on DailyTaskBoardUi.');
            return false;
        }
        if(!this.objectUi){
            Logger.error('Missing objectUi on DailyTaskBoardUi.');
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
            return false;
        }
        let output = '<div class="dailytask-board">';
        output += '<div class="dailytask-date">Tarefas de '+result.date+'</div>';
        for(let task of sc.get(result, 'tasks', [])){
            let state = task.claimed ? 'claimed' : (task.met ? 'met' : '');
            output += '<div class="dailytask-row '+state+'">'
                +'<div class="dailytask-title">'+task.label+'</div>'
                +(task.description ? '<div class="dailytask-desc">'+task.description+'</div>' : '')
                +'<div class="dailytask-progress">'+task.current+' / '+task.quantity+'</div>';
            if(!task.claimed && task.met){
                output += '<button class="dailytask-claim" data-id="'+task.id+'">Reivindicar</button>';
            }
            if(task.claimed){
                output += '<span class="dailytask-claimed-tag">Concluído</span>';
            }
            output += '</div>';
        }
        output += '</div>';
        container.innerHTML = output;
        this.activateClaims();
        return true;
    }

    /**
     * @returns {boolean}
     */
    activateClaims()
    {
        let gameDom = this.gameManager.gameDom;
        gameDom.querySelectorAll('.dailytask-claim').forEach((button) => {
            button.addEventListener('click', () => {
                this.gameManager.activeRoomEvents.send({
                    act: ACTION_CLAIM,
                    id: this.message.id,
                    taskId: Number(button.getAttribute('data-id'))
                });
            });
        });
        return true;
    }

}

module.exports.DailyTaskBoardUi = DailyTaskBoardUi;
