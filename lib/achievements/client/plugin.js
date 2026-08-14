/**
 *
 * Reldens - Achievements Client Plugin
 *
 * Registers the client-side message listener for the achievements board.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { AchievementMessageListener } = require('./achievement-message-listener');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager
 */
class AchievementsClientPlugin extends PluginInterface
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
            Logger.error('Game Manager undefined in AchievementsClientPlugin.');
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
        this.gameManager.config.client.message.listeners['achievement'] = new AchievementMessageListener();
        return true;
    }

}

module.exports.AchievementsClientPlugin = AchievementsClientPlugin;
