/**
 *
 * Reldens - BankMessageListener
 *
 * Handles client-side messages for banker objects.
 *
 */

const { BankObjectUi } = require('./bank-object-ui');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../rooms/client/room-events').RoomEvents} RoomEvents
 *
 * @typedef {Object} MessageActionsProps
 * @property {Object} message
 * @property {RoomEvents} roomEvents
 */
class BankMessageListener
{

    /**
     * @param {MessageActionsProps} props
     * @returns {Promise<boolean|undefined>}
     */
    async executeClientMessageActions(props)
    {
        let message = sc.get(props, 'message', false);
        if(!message){
            Logger.error('Missing message data on BankMessageListener.', props);
            return false;
        }
        let roomEvents = sc.get(props, 'roomEvents', false);
        if(!roomEvents){
            Logger.error('Missing RoomEvents on BankMessageListener.', props);
            return false;
        }
        let bankObjectUi = new BankObjectUi({roomEvents, message});
        if(!bankObjectUi.validate()){
            return false;
        }
        bankObjectUi.updateContents();
    }

}

module.exports.BankMessageListener = BankMessageListener;
