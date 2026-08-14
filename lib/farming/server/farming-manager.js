/**
 *
 * Reldens - FarmingManager
 *
 * Server-side manager for the farming feature. Loads crop definitions from the
 * storage and tracks per-plot state on the "farming_plots" table. Growth is
 * computed lazily from the planted timestamp, so no server timers are needed.
 *
 */

const {
    PLOT_STATE_EMPTY,
    PLOT_STATE_PLANTED,
    PLOT_STATE_READY
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class FarmingManager
{

    /**
     * @param {Object} props
     * @param {Object} props.dataServer
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
        /** @type {Object<string, Object>} */
        this.cropsById = {};
        /** @type {Object<string, Object>} */
        this.cropsByKey = {};
    }

    /**
     * @returns {Promise<void>}
     */
    async loadCrops()
    {
        let cropsRepository = this.dataServer.getEntity('farmingCrops');
        if(!cropsRepository){
            Logger.error('FarmingManager: "farmingCrops" entity not found, run "reldens generateEntities".');
            return;
        }
        let itemsRepository = this.dataServer.getEntity('itemsItem');
        let cropsModels = await cropsRepository.loadAll();
        for(let crop of cropsModels){
            if(!crop.is_active){
                continue;
            }
            let seedItem = itemsRepository ? await itemsRepository.loadOneBy('id', crop.seed_item_id) : null;
            let harvestItem = itemsRepository ? await itemsRepository.loadOneBy('id', crop.harvest_item_id) : null;
            let cropData = {
                id: crop.id,
                key: crop.key,
                label: crop.label,
                description: crop.description,
                seedItemKey: seedItem?.key,
                seedItemLabel: seedItem?.label,
                harvestItemKey: harvestItem?.key,
                harvestItemLabel: harvestItem?.label,
                growthTimeSeconds: Number(crop.growth_time_seconds || 0),
                expReward: Number(crop.exp_reward || 0),
                energyCost: Number(crop.energy_cost || 1),
                harvests: Number(crop.harvests || 1)
            };
            this.cropsById[crop.id] = cropData;
            this.cropsByKey[crop.key] = cropData;
        }
    }

    /**
     * All active crops as a flat list (for the plant menu).
     *
     * @returns {Array<Object>}
     */
    listCrops()
    {
        return Object.values(this.cropsById);
    }

    /**
     * @param {number|string} cropKey
     * @returns {Object|boolean}
     */
    cropByIdentifier(cropKey)
    {
        return sc.get(this.cropsByKey, cropKey, sc.get(this.cropsById, cropKey, false));
    }

    /**
     * @param {number} objectId
     * @returns {Promise<Object|null|false>}
     */
    async plotRowForObject(objectId)
    {
        let repository = this.dataServer.getEntity('farmingPlots');
        if(!repository){
            Logger.error('FarmingManager: "farmingPlots" entity not found, run "reldens generateEntities".');
            return false;
        }
        return await repository.loadOneBy('object_id', objectId);
    }

    /**
     * Make sure the plot object has a state row.
     *
     * @param {number} objectId
     * @returns {Promise<Object|false>}
     */
    async ensurePlot(objectId)
    {
        let repository = this.dataServer.getEntity('farmingPlots');
        if(!repository){
            return false;
        }
        let row = await this.plotRowForObject(objectId);
        if(row){
            return row;
        }
        return await repository.create({
            object_id: objectId,
            player_id: null,
            crop_id: null,
            planted_at: null,
            harvests_remaining: 0
        });
    }

    /**
     * @param {Object} plot
     * @param {Object} crop
     * @returns {string}
     */
    plotState(plot, crop)
    {
        if(!plot || !plot.crop_id || !crop){
            return PLOT_STATE_EMPTY;
        }
        let plantedAt = plot.planted_at ? new Date(plot.planted_at).getTime() : 0;
        let elapsedSeconds = (Date.now() - plantedAt) / 1000;
        if(elapsedSeconds >= crop.growthTimeSeconds){
            return PLOT_STATE_READY;
        }
        return PLOT_STATE_PLANTED;
    }

    /**
     * @param {Object} plot
     * @param {Object} crop
     * @returns {number}
     */
    remainingSeconds(plot, crop)
    {
        let plantedAt = plot.planted_at ? new Date(plot.planted_at).getTime() : 0;
        let elapsedSeconds = (Date.now() - plantedAt) / 1000;
        return Math.max(0, crop.growthTimeSeconds - elapsedSeconds);
    }

    /**
     * @param {Object} plot
     * @param {number} playerId
     * @param {Object} crop
     * @returns {Promise<boolean>}
     */
    async plant(plot, playerId, crop)
    {
        let repository = this.dataServer.getEntity('farmingPlots');
        if(!repository){
            return false;
        }
        await repository.updateById(plot.id, {
            player_id: playerId,
            crop_id: crop.id,
            planted_at: new Date(),
            harvests_remaining: crop.harvests
        });
        return true;
    }

    /**
     * Decrement the remaining harvests and reset the plot when exhausted.
     *
     * @param {Object} plot
     * @returns {Promise<boolean>}
     */
    async harvest(plot)
    {
        let repository = this.dataServer.getEntity('farmingPlots');
        if(!repository){
            return false;
        }
        let remaining = Number(plot.harvests_remaining || 0) - 1;
        let update = {harvests_remaining: Math.max(0, remaining)};
        if(0 >= remaining){
            update.player_id = null;
            update.crop_id = null;
            update.planted_at = null;
        } else {
            update.planted_at = new Date();
        }
        await repository.updateById(plot.id, update);
        return true;
    }

}

module.exports.FarmingManager = FarmingManager;
