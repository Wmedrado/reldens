/**
 *
 * Reldens - QuestPlugin
 *
 * Server-side progress tracking for the quests feature. Hooks into the battle
 * and crafting events to increment the kill / craft objectives progress on the
 * "players_quests" table.
 *
 */

const { QuestManager } = require('./quest-manager');
const { OBJECTIVE_KILL, OBJECTIVE_CRAFT } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class QuestPlugin
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
        /** @type {QuestManager} */
        this.questManager = new QuestManager({dataServer: this.dataServer});
    }

    /**
     * @returns {Promise<boolean>}
     */
    async setup()
    {
        if(!this.events){
            Logger.error('QuestPlugin: EventsManager undefined.');
            return false;
        }
        await this.questManager.loadQuests();
        this.events.on('reldens.battleEnded', async (event) => {
            await this.trackBattleEnded(event);
        });
        this.events.on('reldens.crafting.recipeCompleted', async (event) => {
            await this.trackCraftingCompleted(event);
        });
        return true;
    }

    /**
     * Increment kill objectives for the player that ended the battle.
     *
     * @param {Object} event
     * @returns {Promise<boolean>}
     */
    async trackBattleEnded(event)
    {
        let playerSchema = sc.get(event, 'playerSchema', false);
        let pve = sc.get(event, 'pve', false);
        if(!playerSchema?.player_id || !pve?.targetObject){
            return false;
        }
        let enemyKeys = this.enemyKeys(pve.targetObject);
        let activeRows = await this.questManager.activeQuestsForPlayer(playerSchema.player_id);
        for(let row of activeRows){
            let quest = sc.get(this.questManager.questsById, row.quest_id, false);
            if(!quest){
                continue;
            }
            for(let objective of quest.objectives){
                if(OBJECTIVE_KILL !== objective.type){
                    continue;
                }
                if(-1 === enemyKeys.indexOf(objective.targetKey)){
                    continue;
                }
                await this.questManager.incrementObjective(
                    playerSchema.player_id,
                    quest.id,
                    OBJECTIVE_KILL+':'+objective.targetKey
                );
            }
        }
        return true;
    }

    /**
     * Increment craft objectives when a crafting recipe is completed.
     *
     * @param {Object} event
     * @returns {Promise<boolean>}
     */
    async trackCraftingCompleted(event)
    {
        let playerSchema = sc.get(event, 'playerSchema', false);
        let recipe = sc.get(event, 'recipe', false);
        if(!playerSchema?.player_id || !recipe?.code){
            return false;
        }
        let activeRows = await this.questManager.activeQuestsForPlayer(playerSchema.player_id);
        for(let row of activeRows){
            let quest = sc.get(this.questManager.questsById, row.quest_id, false);
            if(!quest){
                continue;
            }
            for(let objective of quest.objectives){
                if(OBJECTIVE_CRAFT !== objective.type){
                    continue;
                }
                if(objective.targetKey !== recipe.code){
                    continue;
                }
                await this.questManager.incrementObjective(
                    playerSchema.player_id,
                    quest.id,
                    OBJECTIVE_CRAFT+':'+objective.targetKey
                );
            }
        }
        return true;
    }

    /**
     * @param {Object} targetObject
     * @returns {Array<string>}
     */
    enemyKeys(targetObject)
    {
        let keys = [];
        let candidates = ['key', 'object_class_key', 'client_key', 'type'];
        for(let candidate of candidates){
            let value = sc.get(targetObject, candidate, false);
            if(false !== value && -1 === keys.indexOf(value)){
                keys.push(value);
            }
        }
        return keys;
    }

}

module.exports.QuestPlugin = QuestPlugin;
