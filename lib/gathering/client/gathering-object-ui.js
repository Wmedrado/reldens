/**
 *
 * Reldens - GatheringObjectUi
 *
 * Renders gathering results on the client dialog box.
 *
 */

const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager - CUSTOM DYNAMIC
 *
 * @typedef {Object} GatheringObjectUiProps
 * @property {RoomEvents} roomEvents
 * @property {Object} message
 */
class GatheringObjectUi
{

    /**
     * @param {GatheringObjectUiProps} props
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
            Logger.error('Missing RoomEvents on GatheringObjectUi.');
            return false;
        }
        if(!this.message){
            Logger.error('Missing message on GatheringObjectUi.');
            return false;
        }
        if(!this.gameManager){
            Logger.error('Missing GameManager on GatheringObjectUi.');
            return false;
        }
        if(!this.objectUi){
            Logger.error('Missing objectUi on GatheringObjectUi.');
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
        let output = '<div class="gather-result">'
            +'<div class="gather-item">'+result.itemLabel+' x'+result.qty+'</div>';
        if(result.exp > 0){
            output += '<div class="gather-exp">+'+result.exp+' experience</div>';
        }
        output += '</div>';
        container.innerHTML = output;
        return true;
    }

}

module.exports.GatheringObjectUi = GatheringObjectUi;
