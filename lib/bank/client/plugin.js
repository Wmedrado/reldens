/**
 *
 * Reldens - Bank Client Plugin
 *
 * Registers the client-side message listener for banker object messages.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { BankMessageListener } = require('./bank-message-listener');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager
 */
class BankClientPlugin extends PluginInterface
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
            Logger.error('Game Manager undefined in BankClientPlugin.');
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
        this.gameManager.config.client.message.listeners['bank'] = new BankMessageListener();
        return true;
    }

}

module.exports.BankClientPlugin = BankClientPlugin;
