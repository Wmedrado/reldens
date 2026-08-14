/**
 *
 * Reldens - VIPPlugin
 *
 * VIP tiers derived from the blockchain holder tier (see lib/blockchain).
 * Each tier grants gameplay perks (experience boost, energy regeneration
 * boost) applied by the gathering and energy systems. Tier perks are
 * configured under "server/vip/tiers" as a JSON map:
 *
 *   {"0":{"label":"Free","expBoost":1,"energyRegenBoost":1},
 *    "1":{"label":"VIP","expBoost":1.5,"energyRegenBoost":1.5}}
 *
 */

const { CONFIG_TIERS, CONFIG_DEFAULT_TIER } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class VIPPlugin
{

    /**
     * @param {Object} props
     * @param {Object} props.events
     * @param {Object} props.config
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.events = sc.get(props, 'events', false);
        /** @type {Object|boolean} */
        this.config = sc.get(props, 'config', false);
        /** @type {Object} */
        this.tiers = {};
        /** @type {Object<number, Object>} */
        this.tierByAccount = {};
    }

    /**
     * @returns {boolean}
     */
    setup()
    {
        if(!this.events){
            Logger.error('VIPPlugin: EventsManager undefined.');
            return false;
        }
        if(!this.config){
            Logger.error('VIPPlugin: Config undefined.');
            return false;
        }
        this.loadTiers();
        this.events.on('reldens.beforeSuperInitialGameData', (superInitialGameData, roomGame, client, userModel) => {
            let tier = Number(sc.get(superInitialGameData, 'walletHolder.tier', 0) || 0);
            let vip = this.tierFor(tier);
            this.tierByAccount[userModel.id] = vip;
            superInitialGameData.vip = vip;
        });
        this.events.on('reldens.createPlayerStatsAfter', (client, userModel, currentPlayer) => {
            currentPlayer.vip = this.tierByAccount[userModel.id] || this.tierFor(0);
        });
        return true;
    }

    /**
     * @returns {boolean}
     */
    loadTiers()
    {
        let configured = this.config.getWithoutLogs(CONFIG_TIERS, {});
        if(0 === Object.keys(configured).length){
            this.tiers = {
                '0': {label: 'Free', expBoost: 1, energyRegenBoost: 1}
            };
            return true;
        }
        for(let key of Object.keys(configured)){
            let tier = configured[key];
            this.tiers[key] = {
                label: sc.get(tier, 'label', 'Tier '+key),
                expBoost: Number(sc.get(tier, 'expBoost', 1) || 1),
                energyRegenBoost: Number(sc.get(tier, 'energyRegenBoost', 1) || 1)
            };
        }
        return true;
    }

    /**
     * @param {number} tier
     * @returns {Object}
     */
    tierFor(tier)
    {
        let key = String(tier);
        let found = sc.get(this.tiers, key, false);
        if(found){
            return Object.assign({tier: Number(tier)}, found);
        }
        let defaultKey = String(this.config.getWithoutLogs(CONFIG_DEFAULT_TIER, 0));
        return Object.assign({tier: Number(tier)}, sc.get(this.tiers, defaultKey, this.tiers['0'] || {
            label: 'Free', expBoost: 1, energyRegenBoost: 1
        }));
    }

}

module.exports.VIPPlugin = VIPPlugin;
