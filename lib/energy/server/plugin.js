/**
 *
 * Reldens - EnergyPlugin
 *
 * Server-side plugin for the energy feature. Registers the energy message
 * actions, initializes the timestamp row for new players and consumes energy
 * on crafting when configured.
 *
 */

const { EnergyManager } = require('./energy-manager');
const { EnergyMessageActions } = require('./message-actions');
const { Logger, sc } = require('@reldens/utils');

class EnergyPlugin
{

    /**
     * @param {Object} props
     * @param {Object} props.events
     * @param {Object} props.dataServer
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.events = sc.get(props, 'events', false);
        /** @type {Object|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
        /** @type {EnergyManager} */
        this.manager = new EnergyManager({dataServer: this.dataServer});
    }

    /**
     * @returns {boolean}
     */
    setup()
    {
        if(!this.events){
            Logger.error('EnergyPlugin: EventsManager undefined.');
            return false;
        }
        if(!this.dataServer){
            Logger.error('EnergyPlugin: DataServer undefined.');
            return false;
        }
        this.events.on('reldens.roomsMessageActionsGlobal', (roomMessageActions) => {
            roomMessageActions.energy = new EnergyMessageActions({manager: this.manager});
        });
        this.events.on('reldens.createPlayerStatsAfter', async (client, userModel, currentPlayer) => {
            if(!currentPlayer?.player_id){
                return;
            }
            await this.manager.ensurePlayer(currentPlayer.player_id);
        });
        this.events.on('reldens.crafting.recipeCompleted', async (event) => {
            await this.consumeOnCraft(event);
        });
        return true;
    }

    /**
     * @param {Object} event
     * @returns {Promise<boolean>}
     */
    async consumeOnCraft(event)
    {
        let room = sc.get(event, 'room', false);
        let cost = Number(room?.config?.getWithoutLogs?.('server/energy/craftingCostPerRecipe', 0) || 0);
        if(0 >= cost){
            return true;
        }
        let playerSchema = sc.get(event, 'playerSchema', false);
        if(!playerSchema?.player_id){
            return false;
        }
        await this.manager.consume(playerSchema, room, cost);
        return true;
    }

}

module.exports.EnergyPlugin = EnergyPlugin;
