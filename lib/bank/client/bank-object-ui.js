/**
 *
 * Reldens - BankObjectUi
 *
 * Renders the bank window (bank items + inventory items) with withdraw and
 * deposit actions.
 *
 */

const { GameConst } = require('../../game/constants');
const { ACTION_DEPOSIT, ACTION_WITHDRAW } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager - CUSTOM DYNAMIC
 *
 * @typedef {Object} BankObjectUiProps
 * @property {RoomEvents} roomEvents
 * @property {Object} message
 */
class BankObjectUi
{

    /**
     * @param {BankObjectUiProps} props
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
            Logger.error('Missing RoomEvents on BankObjectUi.');
            return false;
        }
        if(!this.message){
            Logger.error('Missing message on BankObjectUi.');
            return false;
        }
        if(!this.gameManager){
            Logger.error('Missing GameManager on BankObjectUi.');
            return false;
        }
        if(!this.objectUi){
            Logger.error('Missing objectUi on BankObjectUi.');
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
        let output = '<div class="bank-window">';
        output += '<div class="bank-section-title">Bank</div>';
        output += '<div class="bank-rows">';
        for(let item of sc.get(result, 'bank', [])){
            output += '<div class="bank-row">'
                +'<span class="bank-row-label">'+item.label+'</span>'
                +'<span class="bank-row-qty">'+item.qty+'</span>'
                +'<button class="bank-withdraw" data-key="'+item.key+'">Retirar</button>'
                +'<input class="bank-withdraw-qty" data-key="'+item.key+'" type="number" value="1" min="1" max="'+item.qty+'"/>'
                +'</div>';
        }
        output += '</div>';
        output += '<div class="bank-section-title">Inventário</div>';
        output += '<div class="bank-rows">';
        for(let item of sc.get(result, 'inventory', [])){
            output += '<div class="bank-row">'
                +'<span class="bank-row-label">'+item.label+'</span>'
                +'<span class="bank-row-qty">'+item.qty+'</span>'
                +'<input class="bank-deposit-qty" data-idx="'+item.idx+'" type="number" value="1" min="1" max="'+item.qty+'"/>'
                +'<button class="bank-deposit" data-idx="'+item.idx+'">Depositar</button>'
                +'</div>';
        }
        output += '</div>';
        output += '</div>';
        container.innerHTML = output;
        this.activateActions();
        return true;
    }

    /**
     * @returns {boolean}
     */
    activateActions()
    {
        let gameDom = this.gameManager.gameDom;
        gameDom.querySelectorAll('.bank-withdraw').forEach((button) => {
            button.addEventListener('click', () => {
                let key = button.getAttribute('data-key');
                let qty = Number(gameDom.getElement('.bank-withdraw-qty[data-key="'+key+'"]')?.value || 1);
                this.sendAction(ACTION_WITHDRAW, {key, qty});
            });
        });
        gameDom.querySelectorAll('.bank-deposit').forEach((button) => {
            button.addEventListener('click', () => {
                let idx = button.getAttribute('data-idx');
                let qty = Number(gameDom.getElement('.bank-deposit-qty[data-idx="'+idx+'"]')?.value || 1);
                this.sendAction(ACTION_DEPOSIT, {idx, qty});
            });
        });
        return true;
    }

    /**
     * @param {string} act
     * @param {Object} extra
     */
    sendAction(act, extra)
    {
        let data = Object.assign({
            act,
            id: this.message.id
        }, extra);
        this.gameManager.activeRoomEvents.send(data);
    }

}

module.exports.BankObjectUi = BankObjectUi;
