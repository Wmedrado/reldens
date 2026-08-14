/**
 *
 * Reldens - EnchantObject
 *
 * Enchanter NPC. Each enchantment combines an input item + a catalyst item
 * into an output item (adapted from the Kaetram enchanter, expressed as a
 * transform recipe). The player clicks the enchantment in the window and the
 * server consumes the ingredients and adds the result to the inventory.
 *
 */

const { NpcObject } = require('../../objects/server/object/type/npc-object');
const { GameConst } = require('../../game/constants');
const { TYPE_ENCHANTER, OPTION_ENCHANT, SNIPPETS } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../users/server/player').Player} Player
 */
class EnchantObject extends NpcObject
{

    /**
     * @param {Object} props
     */
    constructor(props)
    {
        super(props);
        this.type = TYPE_ENCHANTER;
        this.eventsPrefix = this.uid+'.enchant';
        this.clientParams.type = TYPE_ENCHANTER;
        this.content = sc.get(this.clientParams, 'content', SNIPPETS.OBJECT.CONTENT);
        this.options = sc.get(this.clientParams, 'options', {
            [OPTION_ENCHANT]: {
                label: SNIPPETS.OBJECT.OPTIONS.ENCHANT,
                value: OPTION_ENCHANT
            }
        });
        this.enchantments = {};
        this.dataServer = false;
    }

    /**
     * @param {Object} props
     * @returns {Promise<void>}
     */
    async runAdditionalSetup(props)
    {
        this.dataServer = sc.get(props.objectsManager, 'dataServer', false);
        if(false === this.dataServer){
            Logger.error('EnchantObject: Data Server was not specified.');
            return;
        }
        await this.loadEnchantments();
    }

    /**
     * @returns {Promise<void>}
     */
    async loadEnchantments()
    {
        let repository = this.dataServer.getEntity('enchantments');
        if(!repository){
            Logger.error('EnchantObject: "enchantments" entity not found, run "reldens generateEntities".');
            return;
        }
        let rows = await repository.loadByWithRelations(
            'is_active',
            1,
            ['related_input_item', 'related_catalyst_item', 'related_output_item']
        );
        for(let row of rows){
            this.enchantments[row.id] = {
                id: row.id,
                code: row.code,
                label: row.label,
                inputKey: row.related_input_item?.key || false,
                inputLabel: row.related_input_item?.label || row.input_item_id,
                catalystKey: row.related_catalyst_item?.key || false,
                catalystLabel: row.related_catalyst_item?.label || row.catalyst_item_id,
                outputKey: row.related_output_item?.key || false,
                outputLabel: row.related_output_item?.label || row.output_item_id,
                outputQty: Number(row.output_qty || 1)
            };
        }
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
        if(!this.dataServer){
            return false;
        }
        if(OPTION_ENCHANT === sc.get(data, 'value', 'init')){
            return await this.openEnchant(client);
        }
        if('enchant.do' === sc.get(data, 'act', '')){
            let enchantment = sc.get(this.enchantments, data.enchantmentId, false);
            if(enchantment){
                await this.doEnchant(enchantment, playerSchema);
            }
            return await this.openEnchant(client);
        }
        return false;
    }

    /**
     * @param {Object} client
     * @returns {Promise<boolean>}
     */
    async openEnchant(client)
    {
        let enchantments = [];
        for(let id of Object.keys(this.enchantments)){
            let enchantment = this.enchantments[id];
            enchantments.push({
                id: enchantment.id,
                label: enchantment.label,
                inputLabel: enchantment.inputLabel,
                catalystLabel: enchantment.catalystLabel,
                outputLabel: enchantment.outputLabel,
                outputQty: enchantment.outputQty
            });
        }
        client.send('*', {
            act: GameConst.UI,
            id: this.id,
            result: {enchantments, enchanterId: this.id},
            listener: 'enchant'
        });
        return true;
    }

    /**
     * @param {Object} enchantment
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async doEnchant(enchantment, playerSchema)
    {
        let inventory = playerSchema.inventory.manager;
        if(false === enchantment.inputKey || false === enchantment.catalystKey || false === enchantment.outputKey){
            return false;
        }
        if(
            !this.ownsQuantity(inventory, enchantment.inputKey, 1)
            || !this.ownsQuantity(inventory, enchantment.catalystKey, 1)
        ){
            return false;
        }
        let consumedInput = await this.consumeKey(inventory, enchantment.inputKey, 1);
        if(false === consumedInput){
            return false;
        }
        let consumedCatalyst = await this.consumeKey(inventory, enchantment.catalystKey, 1);
        if(false === consumedCatalyst){
            return false;
        }
        let itemInstance = inventory.createItemInstance(enchantment.outputKey, enchantment.outputQty);
        if(false === itemInstance){
            return false;
        }
        let instances = !sc.isArray(itemInstance) ? [itemInstance] : itemInstance;
        let addResult = await inventory.addItems(instances);
        if(false === addResult){
            return false;
        }
        await this.events.emit('reldens.enchant.enchantmentDone', {enchantment, playerSchema});
        return true;
    }

    /**
     * @param {Object} inventory
     * @param {string} key
     * @param {number} qty
     * @returns {number}
     */
    ownsQuantity(inventory, key, qty)
    {
        let total = 0;
        for(let i of Object.keys(inventory.items)){
            if(inventory.items[i].key === key){
                total += inventory.items[i].qty;
            }
        }
        return total >= qty;
    }

    /**
     * @param {Object} inventory
     * @param {string} key
     * @param {number} qty
     * @returns {Promise<boolean>}
     */
    async consumeKey(inventory, key, qty)
    {
        let remaining = qty;
        for(let i of Object.keys(inventory.items)){
            if(0 >= remaining){
                break;
            }
            let item = inventory.items[i];
            if(item.key !== key){
                continue;
            }
            if(item.qty <= remaining){
                remaining -= item.qty;
                let removed = await inventory.removeItem(i);
                if(false === removed){
                    return false;
                }
                continue;
            }
            let decreased = await inventory.decreaseItemQty(i, remaining);
            if(false === decreased){
                return false;
            }
            remaining = 0;
        }
        return 0 === remaining;
    }

}

module.exports.EnchantObject = EnchantObject;
