/**
 *
 * Reldens - ServerEventsManager
 *
 * Tracks the active global events (double experience, double drops, double
 * gathering), mirrors them to the client through the super initial game data
 * and broadcasts changes. Multipliers are read from the server config and can
 * be flipped at runtime (e.g. by the admin panel).
 *
 */

const {
    CONFIG_ENABLED,
    CONFIG_DOUBLE_EXPERIENCE,
    CONFIG_DOUBLE_DROPS,
    CONFIG_DOUBLE_GATHERING,
    EVENT_CHANGED
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class ServerEventsManager
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
        this.enabled = false;
        this.doubleExperience = false;
        this.doubleDrops = false;
        this.doubleGathering = false;
    }

    /**
     * @returns {boolean}
     */
    loadConfig()
    {
        if(!this.config){
            return false;
        }
        this.doubleExperience = Boolean(this.config.getWithoutLogs(CONFIG_DOUBLE_EXPERIENCE, false));
        this.doubleDrops = Boolean(this.config.getWithoutLogs(CONFIG_DOUBLE_DROPS, false));
        this.doubleGathering = Boolean(this.config.getWithoutLogs(CONFIG_DOUBLE_GATHERING, false));
        this.enabled = Boolean(this.config.getWithoutLogs(CONFIG_ENABLED, false))
            || this.doubleExperience || this.doubleDrops || this.doubleGathering;
        return true;
    }

    /**
     * @param {string} key
     * @returns {number}
     */
    multiplier(key)
    {
        if(!this.enabled){
            return 1;
        }
        if(CONFIG_DOUBLE_EXPERIENCE === key && this.doubleExperience){
            return 2;
        }
        if(CONFIG_DOUBLE_DROPS === key && this.doubleDrops){
            return 2;
        }
        if(CONFIG_DOUBLE_GATHERING === key && this.doubleGathering){
            return 2;
        }
        return 1;
    }

    /**
     * @param {string} key
     * @param {boolean} value
     * @returns {boolean}
     */
    setFlag(key, value)
    {
        let flagKey = {
            [CONFIG_DOUBLE_EXPERIENCE]: 'doubleExperience',
            [CONFIG_DOUBLE_DROPS]: 'doubleDrops',
            [CONFIG_DOUBLE_GATHERING]: 'doubleGathering'
        }[key];
        if(!flagKey){
            return false;
        }
        this[flagKey] = Boolean(value);
        this.enabled = this.doubleExperience || this.doubleDrops || this.doubleGathering;
        this.events?.emit(EVENT_CHANGED, {manager: this, key, value: Boolean(value)});
        return true;
    }

    /**
     * Public state sent to clients (badges).
     *
     * @returns {Object}
     */
    publicState()
    {
        return {
            enabled: this.enabled,
            doubleExperience: this.doubleExperience,
            doubleDrops: this.doubleDrops,
            doubleGathering: this.doubleGathering
        };
    }

}

module.exports.ServerEventsManager = ServerEventsManager;
