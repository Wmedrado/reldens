/**
 *
 * Reldens - Enchant Client Plugin
 *
 * Registers the client-side message listener for the enchanter NPC.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { EnchantMessageListener } = require('./enchant-message-listener');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager
 */
class EnchantClientPlugin extends PluginInterface
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
            Logger.error('Game Manager undefined in EnchantClientPlugin.');
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
        this.gameManager.config.client.message.listeners['enchant'] = new EnchantMessageListener();
        return true;
    }

}

module.exports.EnchantClientPlugin = EnchantClientPlugin;
