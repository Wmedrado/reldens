/**
 *
 * Reldens - AchievementBoardUi
 *
 * Renders the achievements list with progress and claim buttons.
 *
 */

const { GameConst } = require('../../game/constants');
const { ACTION_CLAIM } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager - CUSTOM DYNAMIC
 *
 * @typedef {Object} AchievementBoardUiProps
 * @property {RoomEvents} roomEvents
 * @property {Object} message
 */
class AchievementBoardUi
{

    /**
     * @param {AchievementBoardUiProps} props
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
            Logger.error('Missing RoomEvents on AchievementBoardUi.');
            return false;
        }
        if(!this.message){
            Logger.error('Missing message on AchievementBoardUi.');
            return false;
        }
        if(!this.gameManager){
            Logger.error('Missing GameManager on AchievementBoardUi.');
            return false;
        }
        if(!this.objectUi){
            Logger.error('Missing objectUi on AchievementBoardUi.');
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
        let output = '<div class="achievement-board">';
        for(let achievement of sc.get(result, 'achievements', [])){
            let state = achievement.claimed ? 'claimed' : (achievement.met ? 'met' : '');
            output += '<div class="achievement-row '+state+'">'
                +'<div class="achievement-title">'+achievement.label+'</div>'
                +(achievement.description ? '<div class="achievement-desc">'+achievement.description+'</div>' : '')
                +'<div class="achievement-progress">'+achievement.current+' / '+achievement.quantity+'</div>';
            if(!achievement.claimed && achievement.met){
                output += '<button class="achievement-claim" data-id="'+achievement.id+'">Reivindicar</button>';
            }
            if(achievement.claimed){
                output += '<span class="achievement-claimed-tag">Concluído</span>';
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
        gameDom.querySelectorAll('.achievement-claim').forEach((button) => {
            button.addEventListener('click', () => {
                this.gameManager.activeRoomEvents.send({
                    act: ACTION_CLAIM,
                    id: this.message.id,
                    achievementId: Number(button.getAttribute('data-id'))
                });
            });
        });
        return true;
    }

}

module.exports.AchievementBoardUi = AchievementBoardUi;
