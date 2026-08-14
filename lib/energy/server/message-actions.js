/**
 *
 * Reldens - EnergyMessageActions
 *
 * Handles energy-related message actions from clients.
 *
 */

const { ACTION_USE, ACTION_RESULT, SNIPPETS } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('@colyseus/core').Client} Client
 * @typedef {import('../../rooms/server/scene').RoomScene} RoomScene
 */
class EnergyMessageActions
{

    /**
     * @param {Object} props
     * @param {Object} props.manager
     */
    constructor(props)
    {
        /** @type {Object} */
        this.manager = props.manager;
    }

    /**
     * @param {Client} client
     * @param {Object} data
     * @param {RoomScene} room
     * @param {Object} playerSchema
     * @returns {Promise<boolean>}
     */
    async executeMessageActions(client, data, room, playerSchema)
    {
        if(ACTION_USE !== sc.get(data, 'act', '')){
            return false;
        }
        let amount = Number(sc.get(data, 'amount', 1) || 1);
        let result = await this.manager.consume(playerSchema, room, amount);
        let sendData = {
            act: ACTION_RESULT,
            success: result.success,
            energy: result.energy,
            amount
        };
        if(!result.success){
            sendData.message = SNIPPETS.NOT_ENOUGH_ENERGY;
        }
        client.send('*', sendData);
        await room.savePlayerStats(playerSchema, client);
        return true;
    }

}

module.exports.EnergyMessageActions = EnergyMessageActions;
