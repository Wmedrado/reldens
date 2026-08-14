/**
 *
 * Reldens - AchievementMessageListener
 *
 * Handles client-side messages for the achievements board.
 *
 */

const { AchievementBoardUi } = require('./achievement-board-ui');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 *
 * @typedef {Object} MessageActionsProps
 * @property {Object} message
 * @property {RoomEvents} roomEvents
 */
class AchievementMessageListener
{

    /**
     * @param {MessageActionsProps} props
     * @returns {Promise<boolean|undefined>}
     */
    async executeClientMessageActions(props)
    {
        let message = sc.get(props, 'message', false);
        if(!message){
            Logger.error('Missing message data on AchievementMessageListener.', props);
            return false;
        }
        let roomEvents = sc.get(props, 'roomEvents', false);
        if(!roomEvents){
            Logger.error('Missing RoomEvents on AchievementMessageListener.', props);
            return false;
        }
        let achievementBoardUi = new AchievementBoardUi({roomEvents, message});
        if(!achievementBoardUi.validate()){
            return false;
        }
        achievementBoardUi.updateContents();
    }

}

module.exports.AchievementMessageListener = AchievementMessageListener;
