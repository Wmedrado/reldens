/**
 *
 * Reldens - DailyTasks Client Plugin
 *
 * Registers the client-side message listener for the daily task board.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { DailyTaskMessageListener } = require('./daily-task-message-listener');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager
 */
class DailyTasksClientPlugin extends PluginInterface
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
            Logger.error('Game Manager undefined in DailyTasksClientPlugin.');
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
        this.gameManager.config.client.message.listeners['dailytask'] = new DailyTaskMessageListener();
        return true;
    }

}

module.exports.DailyTasksClientPlugin = DailyTasksClientPlugin;
