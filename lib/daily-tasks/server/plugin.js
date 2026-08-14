/**
 *
 * Reldens - DailyTasksPlugin
 *
 * Tracks daily task progress from game events and attaches the manager.
 *
 */

const { DailyTasksManager } = require('./daily-tasks-manager');
const { Logger, sc } = require('@reldens/utils');

class DailyTasksPlugin
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
        /** @type {DailyTasksManager} */
        this.manager = new DailyTasksManager({dataServer: this.dataServer});
    }

    /**
     * @returns {Promise<boolean>}
     */
    async setup()
    {
        if(!this.events){
            Logger.error('DailyTasksPlugin: EventsManager undefined.');
            return false;
        }
        await this.manager.loadTasks();
        this.events.on('reldens.battleEnded', async (event) => {
            await this.trackKill(event);
        });
        this.events.on('reldens.gathering.resourceGathered', async (event) => {
            await this.trackGather(event);
        });
        this.events.on('reldens.crafting.recipeCompleted', async (event) => {
            await this.trackCraft(event);
        });
        return true;
    }

    /**
     * @param {Object} event
     * @returns {Promise<boolean>}
     */
    async trackKill(event)
    {
        let playerId = sc.get(event, 'playerSchema.player_id', false);
        if(!playerId){
            return false;
        }
        let keys = [];
        let targetObject = sc.get(event, 'pve.targetObject', false);
        if(targetObject){
            for(let candidate of ['key', 'object_class_key', 'client_key', 'type']){
                let value = sc.get(targetObject, candidate, false);
                if(false !== value && -1 === keys.indexOf(value)){
                    keys.push(value);
                }
            }
        }
        if(0 === keys.length){
            keys = [''];
        }
        for(let key of keys){
            await this.manager.increment(playerId, 'kill:'+key);
        }
        return true;
    }

    /**
     * @param {Object} event
     * @returns {Promise<boolean>}
     */
    async trackGather(event)
    {
        let playerId = sc.get(event, 'playerSchema.player_id', false);
        let resource = sc.get(event, 'resource', false);
        if(!playerId || !resource){
            return false;
        }
        return await this.manager.increment(playerId, 'gather:'+resource.code);
    }

    /**
     * @param {Object} event
     * @returns {Promise<boolean>}
     */
    async trackCraft(event)
    {
        let playerId = sc.get(event, 'playerSchema.player_id', false);
        let recipe = sc.get(event, 'recipe', false);
        if(!playerId || !recipe?.code){
            return false;
        }
        return await this.manager.increment(playerId, 'craft:'+recipe.code);
    }

}

module.exports.DailyTasksPlugin = DailyTasksPlugin;
