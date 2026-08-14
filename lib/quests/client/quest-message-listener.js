/**
 *
 * Reldens - QuestMessageListener
 *
 * Handles client-side messages for quest giver objects.
 *
 */

const { QuestObjectUi } = require('./quest-object-ui');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 *
 * @typedef {Object} MessageActionsProps
 * @property {Object} message
 * @property {RoomEvents} roomEvents
 */
class QuestMessageListener
{

    /**
     * @param {MessageActionsProps} props
     * @returns {Promise<boolean|undefined>}
     */
    async executeClientMessageActions(props)
    {
        let message = sc.get(props, 'message', false);
        if(!message){
            Logger.error('Missing message data on QuestMessageListener.', props);
            return false;
        }
        let roomEvents = sc.get(props, 'roomEvents', false);
        if(!roomEvents){
            Logger.error('Missing RoomEvents on QuestMessageListener.', props);
            return false;
        }
        let questObjectUi = new QuestObjectUi({roomEvents, message});
        if(!questObjectUi.validate()){
            return false;
        }
        questObjectUi.updateContents();
    }

}

module.exports.QuestMessageListener = QuestMessageListener;
