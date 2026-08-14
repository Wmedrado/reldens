/**
 *
 * Reldens - Gathering Client Plugin
 *
 * Registers the client-side message listener for gathering resource messages.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { GatheringMessageListener } = require('./gathering-message-listener');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager
 */
class GatheringClientPlugin extends PluginInterface
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
            Logger.error('Game Manager undefined in GatheringClientPlugin.');
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
        this.gameManager.config.client.message.listeners['gathering'] = new GatheringMessageListener();
        return true;
    }

}

module.exports.GatheringClientPlugin = GatheringClientPlugin;
