/**
 *
 * Reldens - QuestManager
 *
 * Server-side manager for the quests feature. Loads quest definitions from the
 * storage, tracks objective progress (kill / craft / gather) and grants
 * rewards on turn-in. Progress is persisted on the "players_quests" table.
 *
 */

const {
    QUEST_STATUS_ACTIVE,
    QUEST_STATUS_CLAIMED,
    OBJECTIVE_KILL,
    OBJECTIVE_GATHER,
    OBJECTIVE_CRAFT
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class QuestManager
{

    /**
     * @param {Object} props
     * @param {Object} props.dataServer
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
        /** @type {Object<string, Object>} */
        this.questsById = {};
    }

    /**
     * @returns {Promise<void>}
     */
    async loadQuests()
    {
        let questsRepository = this.dataServer.getEntity('quests');
        if(!questsRepository){
            Logger.error('QuestManager: "quests" entity not found, run "reldens generateEntities".');
            return;
        }
        let questsModels = await questsRepository.loadAll();
        for(let quest of questsModels){
            if(!quest.is_active){
                continue;
            }
            let objectivesRepository = this.dataServer.getEntity('questsObjectives');
            let objectivesModels = await objectivesRepository.loadByWithRelations(
                'quest_id',
                quest.id
            );
            let rewardsRepository = this.dataServer.getEntity('questsRewards');
            let rewardsModels = await rewardsRepository.loadByWithRelations(
                'quest_id',
                quest.id,
                ['related_items_item']
            );
            let questData = {
                id: quest.id,
                code: quest.code,
                label: quest.label,
                description: quest.description,
                objectId: quest.object_id,
                rewardExp: Number(quest.reward_exp || 0),
                objectives: [],
                rewards: []
            };
            for(let objective of objectivesModels){
                questData.objectives.push({
                    id: objective.id,
                    type: objective.type,
                    targetKey: objective.target_key,
                    quantity: Number(objective.quantity),
                    label: objective.label
                });
            }
            for(let reward of rewardsModels){
                questData.rewards.push({
                    itemKey: reward.related_items_item?.key || false,
                    itemLabel: reward.related_items_item?.label || reward.item_id,
                    quantity: Number(reward.quantity)
                });
            }
            this.questsById[quest.id] = questData;
        }
    }

    /**
     * @param {number} objectId
     * @returns {Array<Object>}
     */
    getQuestsForObject(objectId)
    {
        let quests = [];
        for(let questId of Object.keys(this.questsById)){
            let quest = this.questsById[questId];
            let isObjectQuest = null === quest.objectId || Number(quest.objectId) === Number(objectId);
            if(isObjectQuest){
                quests.push(quest);
            }
        }
        return quests;
    }

    /**
     * @param {number} playerId
     * @param {number} questId
     * @returns {Promise<Object|false>}
     */
    async activeQuestForPlayer(playerId, questId)
    {
        let repository = this.dataServer.getEntity('playersQuests');
        return await repository.loadOne({player_id: playerId, quest_id: questId, status: QUEST_STATUS_ACTIVE});
    }

    /**
     * @param {number} playerId
     * @returns {Promise<Array<Object>>}
     */
    async activeQuestsForPlayer(playerId)
    {
        let repository = this.dataServer.getEntity('playersQuests');
        let rows = await repository.loadBy('player_id', playerId);
        return rows.filter((row) => QUEST_STATUS_ACTIVE === row.status);
    }

    /**
     * @param {number} playerId
     * @param {number} questId
     * @returns {Promise<boolean>}
     */
    async acceptQuest(playerId, questId)
    {
        let repository = this.dataServer.getEntity('playersQuests');
        let existent = await this.activeQuestForPlayer(playerId, questId);
        if(existent){
            return false;
        }
        let created = await repository.create({
            player_id: playerId,
            quest_id: questId,
            status: QUEST_STATUS_ACTIVE,
            progress: '{}'
        });
        return Boolean(created);
    }

    /**
     * @param {number} playerId
     * @param {number} questId
     * @returns {Promise<Object>}
     */
    async progressForPlayer(playerId, questId)
    {
        let repository = this.dataServer.getEntity('playersQuests');
        let row = await repository.loadOne({player_id: playerId, quest_id: questId});
        if(!row){
            return {};
        }
        try {
            return JSON.parse(row.progress || '{}');
        } catch (error) {
            Logger.error('QuestManager: invalid progress data.', row.progress);
            return {};
        }
    }

    /**
     * @param {number} playerId
     * @param {number} questId
     * @param {string} key
     * @param {number} amount
     * @returns {Promise<boolean>}
     */
    async incrementObjective(playerId, questId, key, amount = 1)
    {
        let repository = this.dataServer.getEntity('playersQuests');
        let row = await repository.loadOne({player_id: playerId, quest_id: questId});
        if(!row){
            return false;
        }
        let progress = await this.progressForPlayer(playerId, questId);
        progress[key] = (progress[key] || 0) + amount;
        await repository.updateById(row.id, {progress: JSON.stringify(progress)});
        return true;
    }

    /**
     * Validate and complete a quest: checks every objective, consumes nothing,
     * grants the item and experience rewards and marks the quest as claimed.
     *
     * @param {Object} quest
     * @param {Object} playerSchema
     * @returns {Promise<Object>}
     */
    async turnInQuest(quest, playerSchema)
    {
        let playerId = playerSchema.player_id;
        let progress = await this.progressForPlayer(playerId, quest.id);
        for(let objective of quest.objectives){
            let met = await this.objectiveMet(objective, progress, playerSchema);
            if(!met){
                return {success: false, message: 'NOT_COMPLETED'};
            }
        }
        let rewardsResult = await this.grantRewards(quest, playerSchema);
        if(false === rewardsResult){
            return {success: false, message: 'REWARD_ERROR'};
        }
        let repository = this.dataServer.getEntity('playersQuests');
        let row = await repository.loadOne({player_id: playerId, quest_id: quest.id});
        if(row){
            await repository.updateById(row.id, {status: QUEST_STATUS_CLAIMED});
        }
        return {success: true, message: 'COMPLETED'};
    }

    /**
     * @param {Object} objective
     * @param {Object} progress
     * @param {Object} playerSchema
     * @returns {Promise<boolean>}
     */
    async objectiveMet(objective, progress, playerSchema)
    {
        if(OBJECTIVE_KILL === objective.type || OBJECTIVE_CRAFT === objective.type){
            let key = objective.type+':'+objective.targetKey;
            return (progress[key] || 0) >= objective.quantity;
        }
        if(OBJECTIVE_GATHER === objective.type){
            return this.ownedQuantityByKey(playerSchema.inventory.manager, objective.targetKey) >= objective.quantity;
        }
        return false;
    }

    /**
     * @param {Object} inventory
     * @param {string} itemKey
     * @returns {number}
     */
    ownedQuantityByKey(inventory, itemKey)
    {
        let total = 0;
        for(let i of Object.keys(inventory.items)){
            let item = inventory.items[i];
            if(item.key === itemKey){
                total += item.qty;
            }
        }
        return total;
    }

    /**
     * @param {Object} quest
     * @param {Object} playerSchema
     * @returns {Promise<boolean>}
     */
    async grantRewards(quest, playerSchema)
    {
        let inventory = playerSchema.inventory.manager;
        for(let reward of quest.rewards){
            if(false === reward.itemKey){
                Logger.error('QuestManager: reward without item key, quest "'+quest.code+'".');
                continue;
            }
            let itemInstance = inventory.createItemInstance(reward.itemKey, reward.quantity);
            if(false === itemInstance){
                Logger.error('QuestManager: could not create reward item "'+reward.itemKey+'".');
                continue;
            }
            let instances = !sc.isArray(itemInstance) ? [itemInstance] : itemInstance;
            let addResult = await inventory.addItems(instances);
            if(false === addResult){
                Logger.error('QuestManager: could not add reward item.', inventory.lastError);
                return false;
            }
        }
        if(0 < quest.rewardExp && playerSchema.skillsServer?.classPath?.addExperience){
            try {
                await playerSchema.skillsServer.classPath.addExperience(quest.rewardExp);
            } catch (error) {
                Logger.error('QuestManager: could not grant experience.', error.message);
            }
        }
        return true;
    }

}

module.exports.QuestManager = QuestManager;
