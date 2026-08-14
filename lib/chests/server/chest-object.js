/**
 *
 * Reldens - ChestObject
 *
 * Interactive loot chest. On "open" it grants the reward items configured on
 * the "objects_items_rewards" table (reward_item_key + reward_quantity) and
 * enters a cooldown. Extends the NPC object so it keeps the standard
 * interaction flow (click -> dialog box with options).
 *
 */

const { NpcObject } = require('../../objects/server/object/type/npc-object');
const { GameConst } = require('../../game/constants');
const { TYPE_CHEST, OPTION_OPEN, SNIPPETS } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../users/server/player').Player} Player
 */
class ChestObject extends NpcObject
{

    /**
     * @param {Object} props
     */
    constructor(props)
    {
        super(props);
        this.type = TYPE_CHEST;
        this.eventsPrefix = this.uid+'.chest';
        this.clientParams.type = TYPE_CHEST;
        this.content = sc.get(this.clientParams, 'content', SNIPPETS.OBJECT.CONTENT);
        this.options = sc.get(this.clientParams, 'options', {
            [OPTION_OPEN]: {
                label: SNIPPETS.OBJECT.OPTIONS.OPEN,
                value: OPTION_OPEN
            }
        });
        this.rewards = [];
        this.cooldownUntil = 0;
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
            Logger.error('ChestObject: Data Server was not specified.');
            return;
        }
        await this.loadRewards();
    }

    /**
     * @returns {Promise<void>}
     */
    async loadRewards()
    {
        let rewardsRepository = this.dataServer.getEntity('objectsItemsRewards');
        if(!rewardsRepository){
            Logger.error('ChestObject: "objectsItemsRewards" entity not found.');
            return;
        }
        let rewardsModels = await rewardsRepository.loadBy('object_id', this.id);
        for(let reward of rewardsModels){
            this.rewards.push({
                itemKey: reward.reward_item_key,
                quantity: Number(reward.reward_quantity || 1)
            });
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
        if(OPTION_OPEN !== sc.get(data, 'value', 'init')){
            return false;
        }
        return await this.openChest(client, room, playerSchema);
    }

    /**
     * @param {Object} client
     * @param {Object} room
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async openChest(client, room, playerSchema)
    {
        let cooldownSeconds = Number(
            room?.config?.getWithoutLogs?.('server/objects/chests/cooldownSeconds', 30) || 30
        );
        if(Date.now() < this.cooldownUntil){
            client.send('*', {act: GameConst.UI, id: this.id, content: SNIPPETS.OBJECT.COOLDOWN});
            return true;
        }
        if(0 === this.rewards.length){
            client.send('*', {act: GameConst.UI, id: this.id, content: SNIPPETS.OBJECT.EMPTY});
            this.cooldownUntil = Date.now() + cooldownSeconds * 1000;
            return true;
        }
        let inventory = playerSchema.inventory.manager;
        let received = [];
        for(let reward of this.rewards){
            let itemInstance = inventory.createItemInstance(reward.itemKey, reward.quantity);
            if(false === itemInstance){
                Logger.error('ChestObject: could not create reward item "'+reward.itemKey+'".');
                continue;
            }
            let instances = !sc.isArray(itemInstance) ? [itemInstance] : itemInstance;
            let addResult = await inventory.addItems(instances);
            if(false === addResult){
                Logger.error('ChestObject: could not add reward item.', inventory.lastError);
                continue;
            }
            received.push(reward.itemKey+' x'+reward.quantity);
        }
        this.cooldownUntil = Date.now() + cooldownSeconds * 1000;
        let content = 0 === received.length ? SNIPPETS.OBJECT.EMPTY : SNIPPETS.OBJECT.LOOT+received.join(', ');
        client.send('*', {act: GameConst.UI, id: this.id, content});
        return true;
    }

}

module.exports.ChestObject = ChestObject;
