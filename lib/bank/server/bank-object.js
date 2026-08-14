/**
 *
 * Reldens - BankObject
 *
 * Interactive banker NPC. Opens the bank window (list of bank + inventory
 * items) and processes deposit / withdraw actions. Items are stored per
 * player on the "bank_items" table through the BankManager.
 *
 */

const { NpcObject } = require('../../objects/server/object/type/npc-object');
const { GameConst } = require('../../game/constants');
const { BankManager } = require('./bank-manager');
const {
    TYPE_BANKER,
    OPTION_OPEN,
    ACTION_DEPOSIT,
    ACTION_WITHDRAW,
    SNIPPETS
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../users/server/player').Player} Player
 */
class BankObject extends NpcObject
{

    /**
     * @param {Object} props
     */
    constructor(props)
    {
        super(props);
        this.type = TYPE_BANKER;
        this.eventsPrefix = this.uid+'.bank';
        this.clientParams.type = TYPE_BANKER;
        this.content = sc.get(this.clientParams, 'content', SNIPPETS.OBJECT.CONTENT);
        this.options = sc.get(this.clientParams, 'options', {
            [OPTION_OPEN]: {
                label: SNIPPETS.OBJECT.OPTIONS.OPEN,
                value: OPTION_OPEN
            }
        });
        this.bankManager = false;
    }

    /**
     * @param {Object} props
     * @returns {Promise<void>}
     */
    async runAdditionalSetup(props)
    {
        let dataServer = sc.get(props.objectsManager, 'dataServer', false);
        if(false === dataServer){
            Logger.error('BankObject: Data Server was not specified.');
            return;
        }
        this.bankManager = new BankManager({dataServer});
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
        if(!this.bankManager){
            return false;
        }
        let act = sc.get(data, 'act', '');
        if(ACTION_DEPOSIT === act){
            await this.bankManager.deposit(
                playerSchema,
                sc.get(data, 'idx', ''),
                Number(sc.get(data, 'qty', 1) || 1)
            );
            return await this.openBank(client, room, playerSchema);
        }
        if(ACTION_WITHDRAW === act){
            await this.bankManager.withdraw(
                playerSchema,
                sc.get(data, 'key', ''),
                Number(sc.get(data, 'qty', 1) || 1)
            );
            return await this.openBank(client, room, playerSchema);
        }
        if(OPTION_OPEN === sc.get(data, 'value', 'init')){
            return await this.openBank(client, room, playerSchema);
        }
        return false;
    }

    /**
     * Send the current bank state (bank items + player inventory) to the
     * client.
     *
     * @param {Object} client
     * @param {Object} room
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async openBank(client, room, playerSchema)
    {
        let itemsModelData = sc.get(room?.config, 'inventory.items', {}) || {};
        let bankRows = await this.bankManager.rowsForPlayer(playerSchema.player_id);
        let bank = [];
        for(let row of bankRows){
            bank.push({
                key: row.item_key,
                label: this.itemLabel(itemsModelData, row.item_key, row.item_key),
                qty: Number(row.qty)
            });
        }
        let inventoryItems = [];
        let inventory = playerSchema.inventory.manager;
        for(let idx of Object.keys(inventory.items)){
            let item = inventory.items[idx];
            inventoryItems.push({idx, key: item.key, label: item.label, qty: item.qty});
        }
        client.send('*', {
            act: GameConst.UI,
            id: this.id,
            result: {bank, inventory: inventoryItems},
            listener: 'bank'
        });
        return true;
    }

    /**
     * @param {Object} itemsModelData
     * @param {string} key
     * @param {string} fallback
     * @returns {string}
     */
    itemLabel(itemsModelData, key, fallback)
    {
        let itemData = sc.get(itemsModelData, key, false);
        return itemData ? String(itemData['data'].label || fallback) : fallback;
    }

}

module.exports.BankObject = BankObject;
