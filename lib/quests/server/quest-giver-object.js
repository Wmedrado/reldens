/**
 *
 * Reldens - QuestGiverObject
 *
 * Interactive object that lets players accept and turn in quests. Extends the
 * NPC object so it keeps the standard interaction flow (click -> dialog box
 * with options). Quest definitions are stored in the "quests",
 * "quests_objectives" and "quests_rewards" tables. A quest is available on a
 * giver when its "object_id" matches the giver or when it is null (global).
 *
 */

const { NpcObject } = require('../../objects/server/object/type/npc-object');
const { GameConst } = require('../../game/constants');
const { QuestManager } = require('./quest-manager');
const {
    TYPE_QUEST,
    OPTION_ACCEPT,
    OPTION_TURN_IN,
    OBJECTIVE_GATHER,
    SNIPPETS
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../users/server/player').Player} Player
 */
class QuestGiverObject extends NpcObject
{

    /**
     * @param {Object} props
     */
    constructor(props)
    {
        super(props);
        this.type = TYPE_QUEST;
        this.eventsPrefix = this.uid+'.quest';
        this.clientParams.type = TYPE_QUEST;
        this.content = sc.get(this.clientParams, 'content', SNIPPETS.OBJECT.CONTENT);
        this.options = sc.get(this.clientParams, 'options', {
            [OPTION_ACCEPT]: {
                label: SNIPPETS.OBJECT.OPTIONS.ACCEPT,
                value: OPTION_ACCEPT
            },
            [OPTION_TURN_IN]: {
                label: SNIPPETS.OBJECT.OPTIONS.TURN_IN,
                value: OPTION_TURN_IN
            }
        });
        this.questManager = false;
    }

    /**
     * @param {Object} props
     * @returns {Promise<void>}
     */
    async runAdditionalSetup(props)
    {
        let dataServer = sc.get(props.objectsManager, 'dataServer', false);
        if(false === dataServer){
            Logger.error('QuestGiverObject: Data Server was not specified.');
            return;
        }
        this.questManager = new QuestManager({dataServer});
        await this.questManager.loadQuests();
    }

    /**
     * @param {Object} client
     * @param {Object} data
     * @param {Object} room
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async executeMessageActions(client, data, room, playerSchema)
    {
        let superResult = await super.executeMessageActions(client, data, room, playerSchema);
        if(false === superResult){
            return false;
        }
        if(!this.questManager){
            return false;
        }
        let questAction = sc.get(data, 'value', 'init');
        if(OPTION_ACCEPT === questAction){
            return await this.acceptQuests(client, data, room, playerSchema);
        }
        if(OPTION_TURN_IN === questAction){
            return await this.turnInQuests(client, data, room, playerSchema);
        }
        return false;
    }

    /**
     * Accept all the available quests of this giver that the player does not
     * have active yet and send the current quest state to the client.
     *
     * @param {Object} client
     * @param {Object} data
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async acceptQuests(client, data, room, playerSchema)
    {
        let availableQuests = this.questManager.getQuestsForObject(this.id);
        for(let quest of availableQuests){
            await this.questManager.acceptQuest(playerSchema.player_id, quest.id);
        }
        let result = await this.questStateForPlayer(playerSchema);
        result.accepted = 0 < availableQuests.length;
        client.send('*', {act: GameConst.UI, id: this.id, result, listener: 'quest'});
        return true;
    }

    /**
     * Turn in every completed active quest and send the updated state.
     *
     * @param {Object} client
     * @param {Object} data
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async turnInQuests(client, data, room, playerSchema)
    {
        let result = await this.questStateForPlayer(playerSchema);
        for(let quest of result.active){
            let turnInResult = await this.questManager.turnInQuest(quest, playerSchema);
            if(!turnInResult.success){
                continue;
            }
            result.turnedIn.push(quest);
        }
        result = await this.questStateForPlayer(playerSchema);
        client.send('*', {act: GameConst.UI, id: this.id, result, listener: 'quest'});
        return true;
    }

    /**
     * Build the current quest state (available + active with progress) for a
     * player so the client can render the quest window.
     *
     * @param {Player} playerSchema
     * @returns {Promise<Object>}
     */
    async questStateForPlayer(playerSchema)
    {
        let playerId = playerSchema.player_id;
        let available = this.questManager.getQuestsForObject(this.id);
        let activeRows = await this.questManager.activeQuestsForPlayer(playerId);
        let activeQuests = [];
        let availableIds = [];
        for(let quest of available){
            availableIds.push(quest.id);
        }
        for(let row of activeRows){
            let quest = sc.get(this.questManager.questsById, row.quest_id, false);
            if(!quest){
                continue;
            }
            let progress = await this.questManager.progressForPlayer(playerId, quest.id);
            let objectives = [];
            let completed = true;
            for(let objective of quest.objectives){
                let met = await this.questManager.objectiveMet(objective, progress, playerSchema);
                objectives.push({
                    type: objective.type,
                    label: objective.label,
                    targetKey: objective.targetKey,
                    quantity: objective.quantity,
                    current: OBJECTIVE_GATHER === objective.type
                        ? this.questManager.ownedQuantityByKey(playerSchema.inventory.manager, objective.targetKey)
                        : (progress[objective.type+':'+objective.targetKey] || 0),
                    met
                });
                if(!met){
                    completed = false;
                }
            }
            activeQuests.push({id: quest.id, code: quest.code, label: quest.label, objectives, completed});
        }
        return {
            available,
            active: activeQuests,
            turnedIn: [],
            questGiverId: this.id
        };
    }

}

module.exports.QuestGiverObject = QuestGiverObject;
