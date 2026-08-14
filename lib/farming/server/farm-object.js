/**
 *
 * Reldens - FarmObject
 *
 * Interactive farm plot object. Extends the NPC object so it keeps the
 * standard interaction flow (click -> dialog box with options). Crops are
 * defined in the "farming_crops" table and per-plot state is persisted in the
 * "farming_plots" table. Growth is computed lazily from the planted timestamp.
 *
 */

const { NpcObject } = require('../../objects/server/object/type/npc-object');
const { GameConst } = require('../../game/constants');
const { FarmingManager } = require('./farming-manager');
const { EnergyManager } = require('../../energy/server/energy-manager');
const {
    TYPE_FARM,
    OPTION_PLANT,
    OPTION_HARVEST,
    PLOT_STATE_EMPTY,
    PLOT_STATE_READY,
    SNIPPETS
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../users/server/player').Player} Player
 */
class FarmObject extends NpcObject
{

    /**
     * @param {Object} props
     */
    constructor(props)
    {
        super(props);
        this.type = TYPE_FARM;
        this.eventsPrefix = this.uid+'.farm';
        this.clientParams.type = TYPE_FARM;
        this.content = sc.get(this.clientParams, 'content', SNIPPETS.OBJECT.CONTENT);
        this.options = sc.get(this.clientParams, 'options', {
            [OPTION_PLANT]: {
                label: SNIPPETS.OBJECT.OPTIONS.PLANT,
                value: OPTION_PLANT
            },
            [OPTION_HARVEST]: {
                label: SNIPPETS.OBJECT.OPTIONS.HARVEST,
                value: OPTION_HARVEST
            }
        });
        this.farmingManager = false;
        this.energyManager = false;
    }

    /**
     * @param {Object} props
     * @returns {Promise<void>}
     */
    async runAdditionalSetup(props)
    {
        let dataServer = sc.get(props.objectsManager, 'dataServer', false);
        if(false === dataServer){
            Logger.error('FarmObject: Data Server was not specified.');
            return;
        }
        this.farmingManager = new FarmingManager({dataServer});
        await this.farmingManager.loadCrops();
        this.energyManager = new EnergyManager({dataServer});
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
        if(!this.farmingManager){
            return false;
        }
        let farmAction = sc.get(data, 'value', 'init');
        if(OPTION_PLANT === farmAction){
            if(!sc.get(data, 'crop', false)){
                return await this.sendFarmState(client, playerSchema, {});
            }
            return await this.doPlant(client, data, room, playerSchema);
        }
        if(OPTION_HARVEST === farmAction){
            return await this.doHarvest(client, data, room, playerSchema);
        }
        return false;
    }

    /**
     * @param {Object} client
     * @param {Object} data
     * @param {Object} room
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async doPlant(client, data, room, playerSchema)
    {
        let plot = await this.farmingManager.ensurePlot(this.id);
        if(!plot){
            return this.sendFarmState(client, playerSchema, {success: false, message: SNIPPETS.OBJECT.NO_CROPS});
        }
        let crop = this.farmingManager.cropByIdentifier(data.crop);
        if(!crop){
            return this.sendFarmState(client, playerSchema, {success: false, message: SNIPPETS.OBJECT.NO_CROPS});
        }
        let state = this.farmingManager.plotState(plot, this.farmingManager.cropsById[plot.crop_id]);
        if(PLOT_STATE_EMPTY !== state){
            return this.sendFarmState(client, playerSchema, {success: false, message: SNIPPETS.OBJECT.PLOT_OCCUPIED});
        }
        let inventory = playerSchema.inventory.manager;
        if(!this.hasItem(inventory, crop.seedItemKey, 1)){
            return this.sendFarmState(client, playerSchema, {success: false, message: SNIPPETS.OBJECT.NO_SEED});
        }
        if(this.energyManager){
            let energyResult = await this.energyManager.consume(playerSchema, room, crop.energyCost);
            if(!energyResult.success){
                return this.sendFarmState(client, playerSchema, {
                    success: false,
                    message: SNIPPETS.OBJECT.NOT_ENOUGH_ENERGY
                });
            }
        }
        let consumeResult = await this.consumeItem(inventory, crop.seedItemKey, 1);
        if(!consumeResult){
            return this.sendFarmState(client, playerSchema, {success: false, message: SNIPPETS.OBJECT.NO_SEED});
        }
        await this.farmingManager.plant(plot, playerSchema.player_id, crop);
        await room.savePlayerStats(playerSchema, client);
        return this.sendFarmState(client, playerSchema, {success: true, message: SNIPPETS.OBJECT.PLANTED});
    }

    /**
     * @param {Object} client
     * @param {Object} data
     * @param {Object} room
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async doHarvest(client, data, room, playerSchema)
    {
        let plot = await this.farmingManager.ensurePlot(this.id);
        if(!plot){
            return this.sendFarmState(client, playerSchema, {success: false, message: SNIPPETS.OBJECT.NO_CROPS});
        }
        let crop = this.farmingManager.cropsById[plot.crop_id];
        let state = this.farmingManager.plotState(plot, crop);
        if(PLOT_STATE_READY !== state){
            return this.sendFarmState(client, playerSchema, {success: false, message: SNIPPETS.OBJECT.PLOT_NOT_READY});
        }
        await this.farmingManager.harvest(plot);
        let inventory = playerSchema.inventory.manager;
        let itemInstance = inventory.createItemInstance(crop.harvestItemKey, 1);
        let instances = !sc.isArray(itemInstance) ? [itemInstance] : itemInstance;
        await inventory.addItems(instances);
        if(0 < crop.expReward){
            await playerSchema.skillsServer.classPath.addExperience(crop.expReward);
        }
        await this.events.emit('reldens.farming.harvestCompleted', {
            farmObject: this,
            playerSchema,
            crop,
            room
        });
        return this.sendFarmState(client, playerSchema, {success: true, message: SNIPPETS.OBJECT.HARVESTED});
    }

    /**
     * @param {Object} client
     * @param {Player} playerSchema
     * @param {Object} result
     * @returns {Promise<boolean>}
     */
    async sendFarmState(client, playerSchema, result)
    {
        client.send('*', this.farmSendData(playerSchema, result));
        return true;
    }

    /**
     * Build the client message with the current plot state and the plantable
     * crops so the UI can render options and countdown.
     *
     * @param {Player} playerSchema
     * @param {Object} result
     * @returns {Object}
     */
    async farmSendData(playerSchema, result)
    {
        let plot = await this.farmingManager.ensurePlot(this.id);
        let crop = plot?.crop_id ? this.farmingManager.cropsById[plot.crop_id] : false;
        let state = this.farmingManager.plotState(plot, crop);
        let cropsData = [];
        for(let cropData of this.farmingManager.listCrops()){
            cropsData.push(this.cropClientData(cropData, playerSchema));
        }
        return {
            act: GameConst.UI,
            id: this.id,
            result: {
                state,
                remainingSeconds: state === 'planted' ? this.farmingManager.remainingSeconds(plot, crop) : 0,
                crop: crop ? {id: crop.id, key: crop.key, label: crop.label} : false,
                crops: cropsData,
                result
            },
            listener: 'farm'
        };
    }

    /**
     * @param {Object} crop
     * @param {Player} playerSchema
     * @returns {Object}
     */
    cropClientData(crop, playerSchema)
    {
        let owned = this.ownedQuantityByKey(playerSchema.inventory.manager, [crop.seedItemKey]);
        return {
            id: crop.id,
            key: crop.key,
            label: crop.label,
            description: crop.description,
            seedItemKey: crop.seedItemKey,
            seedItemLabel: crop.seedItemLabel,
            harvestItemKey: crop.harvestItemKey,
            harvestItemLabel: crop.harvestItemLabel,
            growthTimeSeconds: crop.growthTimeSeconds,
            energyCost: crop.energyCost,
            ownedSeed: owned[crop.seedItemKey] || 0
        };
    }

    /**
     * @param {Object} inventory
     * @param {string} itemKey
     * @param {number} quantity
     * @returns {boolean}
     */
    hasItem(inventory, itemKey, quantity)
    {
        return (this.ownedQuantityByKey(inventory, [itemKey])[itemKey] || 0) >= quantity;
    }

    /**
     * @param {Object} inventory
     * @param {Array<string>} itemKeys
     * @returns {Object<string, number>}
     */
    ownedQuantityByKey(inventory, itemKeys)
    {
        let owned = {};
        for(let i of Object.keys(inventory.items)){
            let item = inventory.items[i];
            if(-1 !== itemKeys.indexOf(item.key)){
                owned[item.key] = (owned[item.key] || 0) + item.qty;
            }
        }
        return owned;
    }

    /**
     * Remove "quantity" units of "itemKey" from the inventory.
     *
     * @param {Object} inventory
     * @param {string} itemKey
     * @param {number} quantity
     * @returns {Promise<boolean>}
     */
    async consumeItem(inventory, itemKey, quantity)
    {
        let remaining = quantity;
        for(let i of Object.keys(inventory.items)){
            if(0 >= remaining){
                break;
            }
            let item = inventory.items[i];
            if(item.key !== itemKey){
                continue;
            }
            if(item.qty <= remaining){
                remaining -= item.qty;
                let removeResult = await inventory.removeItem(i);
                if(false === removeResult){
                    Logger.error('FarmObject: seed remove error.', inventory.lastError);
                    return false;
                }
                continue;
            }
            let decreaseResult = await inventory.decreaseItemQty(i, remaining);
            if(false === decreaseResult){
                Logger.error('FarmObject: seed decrease error.', inventory.lastError);
                return false;
            }
            remaining = 0;
        }
        return 0 === remaining;
    }

}

module.exports.FarmObject = FarmObject;
