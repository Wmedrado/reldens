/**
 *
 * Reldens - EnchantObjectUi
 *
 * Renders the enchantment list with "enchant" buttons.
 *
 */

const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager - CUSTOM DYNAMIC
 *
 * @typedef {Object} EnchantObjectUiProps
 * @property {RoomEvents} roomEvents
 * @property {Object} message
 */
class EnchantObjectUi
{

    /**
     * @param {EnchantObjectUiProps} props
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
            Logger.error('Missing RoomEvents on EnchantObjectUi.');
            return false;
        }
        if(!this.message){
            Logger.error('Missing message on EnchantObjectUi.');
            return false;
        }
        if(!this.gameManager){
            Logger.error('Missing GameManager on EnchantObjectUi.');
            return false;
        }
        if(!this.objectUi){
            Logger.error('Missing objectUi on EnchantObjectUi.');
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
        let output = '<div class="enchant-window">';
        for(let enchantment of sc.get(result, 'enchantments', [])){
            output += '<div class="enchant-row" id="enchant-'+enchantment.id+'">'
                +'<div class="enchant-title">'+enchantment.label+'</div>'
                +'<div class="enchant-recipe">'+enchantment.inputLabel+' + '+enchantment.catalystLabel
                +' → '+enchantment.outputLabel+' x'+enchantment.outputQty+'</div>'
                +'<button class="enchant-do" data-id="'+enchantment.id+'">Encantar</button>'
                +'</div>';
        }
        output += '</div>';
        container.innerHTML = output;
        this.activateEnchants();
        return true;
    }

    /**
     * @returns {boolean}
     */
    activateEnchants()
    {
        let gameDom = this.gameManager.gameDom;
        gameDom.querySelectorAll('.enchant-do').forEach((button) => {
            button.addEventListener('click', () => {
                this.gameManager.activeRoomEvents.send({
                    act: 'enchant.do',
                    id: this.message.id,
                    enchantmentId: Number(button.getAttribute('data-id'))
                });
            });
        });
        return true;
    }

}

module.exports.EnchantObjectUi = EnchantObjectUi;
