/**
 *
 * Reldens - Pets Client Plugin
 *
 * Registers the client-side message listener for the pet dealer NPC.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { PetMessageListener } = require('./pet-message-listener');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager
 */
class PetsClientPlugin extends PluginInterface
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
            Logger.error('Game Manager undefined in PetsClientPlugin.');
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
        this.gameManager.config.client.message.listeners['pet'] = new PetMessageListener();
        return true;
    }

}

module.exports.PetsClientPlugin = PetsClientPlugin;
