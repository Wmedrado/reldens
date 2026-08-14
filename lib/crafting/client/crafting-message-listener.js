/**
 *
 * Reldens - CraftingMessageListener
 *
 * Handles client-side messages for crafting objects.
 *
 */

const { CraftingObjectUi } = require('./crafting-object-ui');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 *
 * @typedef {Object} MessageActionsProps
 * @property {Object} message
 * @property {RoomEvents} roomEvents
 */
class CraftingMessageListener
{

    /**
     * @param {MessageActionsProps} props
     * @returns {Promise<boolean|undefined>}
     */
    async executeClientMessageActions(props)
    {
        let message = sc.get(props, 'message', false);
        if(!message){
            Logger.error('Missing message data on CraftingMessageListener.', props);
            return false;
        }
        let roomEvents = sc.get(props, 'roomEvents', false);
        if(!roomEvents){
            Logger.error('Missing RoomEvents on CraftingMessageListener.', props);
            return false;
        }
        let craftingObjectUi = new CraftingObjectUi({roomEvents, message});
        if(!craftingObjectUi.validate()){
            return false;
        }
        craftingObjectUi.updateContents();
    }

}

module.exports.CraftingMessageListener = CraftingMessageListener;
