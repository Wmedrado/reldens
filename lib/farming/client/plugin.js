/**
 *
 * Reldens - Farming Client Plugin
 *
 * Registers the client-side message listener for farming object messages.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { FarmingMessageListener } = require('./farming-message-listener');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager
 */
class FarmingClientPlugin extends PluginInterface
{

    /**
     * @param {Object} props
     * @param {GameManager} [props.gameManager]
     */
    setup(props)
    {
        /** @type {GameManager|boolean} */
        this.gameManager = sc.get(props, 'gameManager', false);
        if(!this.gameManager){
            Logger.error('Game Manager undefined in FarmingClientPlugin.');
            return;
        }
        this.registerListener();
    }

    /**
     * @returns {boolean}
     */
    registerListener()
    {
        if(!this.gameManager){
            return false;
        }
        this.gameManager.config.client.message.listeners['farm'] = new FarmingMessageListener();
        return true;
    }

}

module.exports.FarmingClientPlugin = FarmingClientPlugin;
