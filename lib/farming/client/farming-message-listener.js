/**
 *
 * Reldens - FarmingMessageListener
 *
 * Handles client-side messages for farming objects.
 *
 */

const { FarmingObjectUi } = require('./farming-object-ui');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 *
 * @typedef {Object} MessageActionsProps
 * @property {Object} message
 * @property {RoomEvents} roomEvents
 */
class FarmingMessageListener
{

    /**
     * @param {MessageActionsProps} props
     * @returns {Promise<boolean|undefined>}
     */
    async executeClientMessageActions(props)
    {
        let message = sc.get(props, 'message', false);
        if(!message){
            Logger.error('Missing message data on FarmingMessageListener.', props);
            return false;
        }
        let roomEvents = sc.get(props, 'roomEvents', false);
        if(!roomEvents){
            Logger.error('Missing RoomEvents on FarmingMessageListener.', props);
            return false;
        }
        let farmingObjectUi = new FarmingObjectUi({roomEvents, message});
        if(!farmingObjectUi.validate()){
            return false;
        }
        farmingObjectUi.updateContents();
    }

}

module.exports.FarmingMessageListener = FarmingMessageListener;
