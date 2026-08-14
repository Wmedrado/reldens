/**
 *
 * Reldens - GatheringMessageListener
 *
 * Handles client-side messages for gathering resource objects.
 *
 */

const { GatheringObjectUi } = require('./gathering-object-ui');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 *
 * @typedef {Object} MessageActionsProps
 * @property {Object} message
 * @property {RoomEvents} roomEvents
 */
class GatheringMessageListener
{

    /**
     * @param {MessageActionsProps} props
     * @returns {Promise<boolean|undefined>}
     */
    async executeClientMessageActions(props)
    {
        let message = sc.get(props, 'message', false);
        if(!message){
            Logger.error('Missing message data on GatheringMessageListener.', props);
            return false;
        }
        let roomEvents = sc.get(props, 'roomEvents', false);
        if(!roomEvents){
            Logger.error('Missing RoomEvents on GatheringMessageListener.', props);
            return false;
        }
        let gatheringObjectUi = new GatheringObjectUi({roomEvents, message});
        if(!gatheringObjectUi.validate()){
            return false;
        }
        gatheringObjectUi.updateContents();
    }

}

module.exports.GatheringMessageListener = GatheringMessageListener;
