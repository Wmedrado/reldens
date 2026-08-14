/**
 *
 * Reldens - StatusEffectsMessageActions
 *
 * Handles status effects message actions from clients (dev/testing apply and
 * remove). Gameplay code should normally use the
 * "reldens.statusEffects.apply" event instead.
 *
 */

const { ACTION_APPLY, ACTION_REMOVE, ACTION_RESULT } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('@colyseus/core').Client} Client
 * @typedef {import('../../rooms/server/scene').RoomScene} RoomScene
 */
class StatusEffectsMessageActions
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
        let act = sc.get(data, 'act', '');
        if(ACTION_APPLY === act){
            return await this.applyAction(client, data, room, playerSchema);
        }
        if(ACTION_REMOVE === act){
            this.manager.removeEffect(playerSchema, sc.get(data, 'key', ''));
            client.send('*', {act: ACTION_RESULT, success: true});
            return true;
        }
        return false;
    }

    /**
     * @param {Client} client
     * @param {Object} data
     * @param {RoomScene} room
     * @param {Object} playerSchema
     * @returns {Promise<boolean>}
     */
    async applyAction(client, data, room, playerSchema)
    {
        let effect = sc.get(data, 'effect', false);
        if(!effect){
            Logger.error('StatusEffectsMessageActions: missing effect data.');
            return false;
        }
        effect.target = playerSchema;
        effect.onTick = async ({target}) => {
            await room.savePlayerStats(target, client);
        };
        let result = await this.manager.applyEffect(effect);
        client.send('*', {
            act: ACTION_RESULT,
            success: Boolean(result),
            key: sc.get(effect, 'key', false)
        });
        return true;
    }

}

module.exports.StatusEffectsMessageActions = StatusEffectsMessageActions;
