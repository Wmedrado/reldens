/**
 *
 * Reldens - AchievementPlugin
 *
 * Tracks achievement progress from game events (battles, gathering, crafting,
 * quests) and persists it through the AchievementManager.
 *
 */

const { AchievementManager } = require('./achievement-manager');
const { Logger, sc } = require('@reldens/utils');

class AchievementPlugin
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
        /** @type {AchievementManager} */
        this.manager = new AchievementManager({dataServer: this.dataServer});
    }

    /**
     * @returns {Promise<boolean>}
     */
    async setup()
    {
        if(!this.events){
            Logger.error('AchievementPlugin: EventsManager undefined.');
            return false;
        }
        await this.manager.loadAchievements();
        this.events.on('reldens.battleEnded', async (event) => {
            await this.trackKill(event);
        });
        this.events.on('reldens.gathering.resourceGathered', async (event) => {
            await this.trackGather(event);
        });
        this.events.on('reldens.crafting.recipeCompleted', async (event) => {
            await this.trackCraft(event);
        });
        this.events.on('reldens.quests.questCompleted', async (event) => {
            await this.trackQuest(event);
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
        let keys = ['gather:'+resource.code];
        if(-1 === keys.indexOf('gather:'+resource.itemKey)){
            keys.push('gather:'+resource.itemKey);
        }
        for(let key of keys){
            await this.manager.increment(playerId, key);
        }
        return true;
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

    /**
     * @param {Object} event
     * @returns {Promise<boolean>}
     */
    async trackQuest(event)
    {
        let playerId = sc.get(event, 'playerSchema.player_id', false);
        let quest = sc.get(event, 'quest', false);
        if(!playerId || !quest?.code){
            return false;
        }
        return await this.manager.increment(playerId, 'quest:'+quest.code);
    }

}

module.exports.AchievementPlugin = AchievementPlugin;
