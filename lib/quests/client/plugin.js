/**
 *
 * Reldens - Quests Client Plugin
 *
 * Registers the client-side message listener for quest giver object messages.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { QuestMessageListener } = require('./quest-message-listener');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager
 */
class QuestsClientPlugin extends PluginInterface
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
            Logger.error('Game Manager undefined in QuestsClientPlugin.');
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
        this.gameManager.config.client.message.listeners['quest'] = new QuestMessageListener();
        return true;
    }

}

module.exports.QuestsClientPlugin = QuestsClientPlugin;
