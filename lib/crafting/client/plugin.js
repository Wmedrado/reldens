/**
 *
 * Reldens - Crafting Client Plugin
 *
 * Registers the client-side message listener for crafting object messages.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { CraftingMessageListener } = require('./crafting-message-listener');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager
 * @typedef {import('@reldens/utils').EventsManager} EventsManager
 */
class CraftingClientPlugin extends PluginInterface
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
            Logger.error('Game Manager undefined in CraftingClientPlugin.');
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
        this.gameManager.config.client.message.listeners['craft'] = new CraftingMessageListener();
        return true;
    }

}

module.exports.CraftingClientPlugin = CraftingClientPlugin;
