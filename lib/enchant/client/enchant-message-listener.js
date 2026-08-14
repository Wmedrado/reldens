/**
 *
 * Reldens - EnchantMessageListener
 *
 * Handles client-side messages for the enchanter NPC.
 *
 */

const { EnchantObjectUi } = require('./enchant-object-ui');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 *
 * @typedef {Object} MessageActionsProps
 * @property {Object} message
 * @property {RoomEvents} roomEvents
 */
class EnchantMessageListener
{

    /**
     * @param {MessageActionsProps} props
     * @returns {Promise<boolean|undefined>}
     */
    async executeClientMessageActions(props)
    {
        let message = sc.get(props, 'message', false);
        if(!message){
            Logger.error('Missing message data on EnchantMessageListener.', props);
            return false;
        }
        let roomEvents = sc.get(props, 'roomEvents', false);
        if(!roomEvents){
            Logger.error('Missing RoomEvents on EnchantMessageListener.', props);
            return false;
        }
        let enchantObjectUi = new EnchantObjectUi({roomEvents, message});
        if(!enchantObjectUi.validate()){
            return false;
        }
        enchantObjectUi.updateContents();
    }

}

module.exports.EnchantMessageListener = EnchantMessageListener;
