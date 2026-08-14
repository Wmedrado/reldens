/**
 *
 * Reldens - PetObjectUi
 *
 * Renders the owned pet and the adoptable pets with adopt buttons.
 *
 */

const { ACTION_ADOPT } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager - CUSTOM DYNAMIC
 *
 * @typedef {Object} PetObjectUiProps
 * @property {RoomEvents} roomEvents
 * @property {Object} message
 */
class PetObjectUi
{

    /**
     * @param {PetObjectUiProps} props
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
            Logger.error('Missing RoomEvents on PetObjectUi.');
            return false;
        }
        if(!this.message){
            Logger.error('Missing message on PetObjectUi.');
            return false;
        }
        if(!this.gameManager){
            Logger.error('Missing GameManager on PetObjectUi.');
            return false;
        }
        if(!this.objectUi){
            Logger.error('Missing objectUi on PetObjectUi.');
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
        let output = '<div class="pet-window">';
        let owned = sc.get(result, 'owned', false);
        if(owned){
            output += '<div class="pet-owned">Seu pet: <strong>'+owned.label+'</strong> (nível '+owned.level+')</div>';
        } else {
            output += '<div class="pet-owned">Você ainda não tem um pet.</div>';
        }
        for(let pet of sc.get(result, 'available', [])){
            output += '<div class="pet-row">'
                +'<span class="pet-label">'+pet.label+'</span>'
                +'<span class="pet-cost">'+pet.adoptItemLabel+'</span>'
                +'<button class="pet-adopt" data-key="'+pet.key+'">Adotar</button>'
                +'</div>';
        }
        output += '</div>';
        container.innerHTML = output;
        this.activateAdopt();
        return true;
    }

    /**
     * @returns {boolean}
     */
    activateAdopt()
    {
        let gameDom = this.gameManager.gameDom;
        gameDom.querySelectorAll('.pet-adopt').forEach((button) => {
            button.addEventListener('click', () => {
                this.gameManager.activeRoomEvents.send({
                    act: ACTION_ADOPT,
                    id: this.message.id,
                    key: button.getAttribute('data-key')
                });
            });
        });
        return true;
    }

}

module.exports.PetObjectUi = PetObjectUi;
