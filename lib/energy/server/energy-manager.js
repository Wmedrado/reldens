/**
 *
 * Reldens - EnergyManager
 *
 * Pixels-style energy system: a regenerating resource stored on the player
 * stats ("energy" stat). Regeneration is computed lazily from the last stored
 * timestamp ("players_energy" table), so no server timers are required.
 *
 */

const {
    STAT_KEY_ENERGY,
    DEFAULT_REGEN_PER_MINUTE,
    DEFAULT_MAX_ENERGY
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class EnergyManager
{

    /**
     * @param {Object} props
     * @param {Object} props.dataServer
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
    }

    /**
     * @param {Object} room
     * @returns {number}
     */
    regenPerMinute(room)
    {
        return Number(room?.config?.getWithoutLogs?.(
            'server/energy/regenPerMinute',
            Number(process.env.RELDENS_ENERGY_REGEN_PER_MINUTE || DEFAULT_REGEN_PER_MINUTE)
        ) || DEFAULT_REGEN_PER_MINUTE);
    }

    /**
     * @param {number} playerId
     * @returns {Promise<Object|false>}
     */
    async energyRowForPlayer(playerId)
    {
        let repository = this.dataServer.getEntity('playersEnergy');
        if(!repository){
            Logger.error('EnergyManager: "playersEnergy" entity not found, run "reldens generateEntities".');
            return false;
        }
        return await repository.loadOneBy('player_id', playerId);
    }

    /**
     * Make sure the player has an energy timestamp row.
     *
     * @param {number} playerId
     * @returns {Promise<boolean>}
     */
    async ensurePlayer(playerId)
    {
        let repository = this.dataServer.getEntity('playersEnergy');
        if(!repository){
            return false;
        }
        let row = await this.energyRowForPlayer(playerId);
        if(row){
            return true;
        }
        let created = await repository.create({player_id: playerId, last_regen_at: new Date()});
        return Boolean(created);
    }

    /**
     * @param {Object} playerSchema
     * @returns {number}
     */
    maxEnergy(playerSchema)
    {
        let statsBase = sc.get(playerSchema, 'statsBase', {}) || {};
        return Number(sc.get(statsBase, STAT_KEY_ENERGY, DEFAULT_MAX_ENERGY) || DEFAULT_MAX_ENERGY);
    }

    /**
     * @param {Object} playerSchema
     * @returns {number}
     */
    currentEnergy(playerSchema)
    {
        let stats = sc.get(playerSchema, 'stats', {}) || {};
        return Number(sc.get(stats, STAT_KEY_ENERGY, 0) || 0);
    }

    /**
     * Apply the pending regeneration since the last stored timestamp and
     * persist both the stat and the new timestamp.
     *
     * @param {Object} playerSchema
     * @param {Object} room
     * @returns {Promise<number>}
     */
    async regen(playerSchema, room)
    {
        let playerId = playerSchema.player_id;
        let row = await this.energyRowForPlayer(playerId);
        let lastRegen = row?.last_regen_at ? new Date(row.last_regen_at).getTime() : Date.now();
        let elapsedMinutes = (Date.now() - lastRegen) / 60000;
        let gained = Math.floor(elapsedMinutes * this.regenPerMinute(room));
        if(0 >= gained){
            return this.currentEnergy(playerSchema);
        }
        let max = this.maxEnergy(playerSchema);
        let newValue = Math.min(max, this.currentEnergy(playerSchema) + gained);
        playerSchema.stats[STAT_KEY_ENERGY] = newValue;
        await this.updateTimestamp(playerId);
        return newValue;
    }

    /**
     * @param {number} playerId
     * @returns {Promise<boolean>}
     */
    async updateTimestamp(playerId)
    {
        let repository = this.dataServer.getEntity('playersEnergy');
        if(!repository){
            return false;
        }
        let row = await this.energyRowForPlayer(playerId);
        if(!row){
            return false;
        }
        await repository.updateById(row.id, {last_regen_at: new Date()});
        return true;
    }

    /**
     * Regenerate first, then try to spend the given amount of energy.
     *
     * @param {Object} playerSchema
     * @param {Object} room
     * @param {number} amount
     * @returns {Promise<Object>}
     */
    async consume(playerSchema, room, amount = 1)
    {
        let current = await this.regen(playerSchema, room);
        if(current < amount){
            return {success: false, energy: current};
        }
        playerSchema.stats[STAT_KEY_ENERGY] = current - amount;
        await this.updateTimestamp(playerSchema.player_id);
        return {success: true, energy: playerSchema.stats[STAT_KEY_ENERGY]};
    }

}

module.exports.EnergyManager = EnergyManager;
