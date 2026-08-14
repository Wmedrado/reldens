/**
 *
 * Reldens - PetMessageListener
 *
 * Handles client-side messages for the pet dealer NPC.
 *
 */

const { PetObjectUi } = require('./pet-object-ui');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 *
 * @typedef {Object} MessageActionsProps
 * @property {Object} message
 * @property {RoomEvents} roomEvents
 */
class PetMessageListener
{

    /**
     * @param {MessageActionsProps} props
     * @returns {Promise<boolean|undefined>}
     */
    async executeClientMessageActions(props)
    {
        let message = sc.get(props, 'message', false);
        if(!message){
            Logger.error('Missing message data on PetMessageListener.', props);
            return false;
        }
        let roomEvents = sc.get(props, 'roomEvents', false);
        if(!roomEvents){
            Logger.error('Missing RoomEvents on PetMessageListener.', props);
            return false;
        }
        let petObjectUi = new PetObjectUi({roomEvents, message});
        if(!petObjectUi.validate()){
            return false;
        }
        petObjectUi.updateContents();
    }

}

module.exports.PetMessageListener = PetMessageListener;
