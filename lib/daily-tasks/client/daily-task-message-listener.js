/**
 *
 * Reldens - DailyTaskMessageListener
 *
 * Handles client-side messages for the daily task board.
 *
 */

const { DailyTaskBoardUi } = require('./daily-task-board-ui');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 *
 * @typedef {Object} MessageActionsProps
 * @property {Object} message
 * @property {RoomEvents} roomEvents
 */
class DailyTaskMessageListener
{

    /**
     * @param {MessageActionsProps} props
     * @returns {Promise<boolean|undefined>}
     */
    async executeClientMessageActions(props)
    {
        let message = sc.get(props, 'message', false);
        if(!message){
            Logger.error('Missing message data on DailyTaskMessageListener.', props);
            return false;
        }
        let roomEvents = sc.get(props, 'roomEvents', false);
        if(!roomEvents){
            Logger.error('Missing RoomEvents on DailyTaskMessageListener.', props);
            return false;
        }
        let dailyTaskBoardUi = new DailyTaskBoardUi({roomEvents, message});
        if(!dailyTaskBoardUi.validate()){
            return false;
        }
        dailyTaskBoardUi.updateContents();
    }

}

module.exports.DailyTaskMessageListener = DailyTaskMessageListener;
