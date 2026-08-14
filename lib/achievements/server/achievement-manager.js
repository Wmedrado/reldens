/**
 *
 * Reldens - AchievementManager
 *
 * Per-player achievements (adapted from Kaetram achievements). Definitions
 * live on the "achievements" table; progress is persisted on the
 * "players_achievements" table. Progress keys are namespaced by objective
 * type, e.g. "kill:enemy_1", "gather:tree_wood", "craft:wood_plank",
 * "quest:kill_trees". An achievement without target_key counts every action
 * of its type.
 *
 */

const {
    ACHIEVEMENT_STATUS_ACTIVE,
    ACHIEVEMENT_STATUS_CLAIMED
} = require('../constants');
const { EventsManagerSingleton, Logger, sc } = require('@reldens/utils');

class AchievementManager
{

    /**
     * @param {Object} props
     * @param {Object} props.dataServer
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
        /** @type {Object} */
        this.events = sc.get(props, 'events', EventsManagerSingleton);
        /** @type {Object<string, Object>} */
        this.achievementsById = {};
    }

    /**
     * @returns {Promise<void>}
     */
    async loadAchievements()
    {
        let repository = this.dataServer.getEntity('achievements');
        if(!repository){
            Logger.error('AchievementManager: "achievements" entity not found, run "reldens generateEntities".');
            return;
        }
        let rows = await repository.loadByWithRelations('is_active', 1);
        for(let row of rows){
            this.achievementsById[row.id] = {
                id: row.id,
                code: row.code,
                label: row.label,
                description: row.description,
                type: row.type,
                targetKey: row.target_key,
                quantity: Number(row.quantity || 1),
                rewardItemKey: row.related_items_item?.key || false,
                rewardExp: Number(row.reward_exp || 0)
            };
        }
    }

    /**
     * @param {number} playerId
     * @returns {Promise<Array<Object>>}
     */
    async activeForPlayer(playerId)
    {
        let repository = this.dataServer.getEntity('playersAchievements');
        let rows = await repository.loadBy('player_id', playerId);
        return rows.filter((row) => ACHIEVEMENT_STATUS_ACTIVE === row.status);
    }

    /**
     * @param {number} playerId
     * @param {number|string} achievementId
     * @returns {Promise<Object|null>}
     */
    async rowForPlayer(playerId, achievementId)
    {
        let repository = this.dataServer.getEntity('playersAchievements');
        return await repository.loadOne({player_id: playerId, achievement_id: Number(achievementId)});
    }

    /**
     * @param {number} playerId
     * @param {number} achievementId
     * @returns {Promise<Object>}
     */
    async progressForPlayer(playerId, achievementId)
    {
        let row = await this.rowForPlayer(playerId, achievementId);
        if(!row){
            return {};
        }
        try {
            return JSON.parse(row.progress || '{}');
        } catch (error) {
            return {};
        }
    }

    /**
     * Start tracking an achievement for a player on first interaction.
     *
     * @param {number} playerId
     * @param {number} achievementId
     * @returns {Promise<boolean>}
     */
    async ensureActive(playerId, achievementId)
    {
        let row = await this.rowForPlayer(playerId, achievementId);
        if(row){
            return true;
        }
        let repository = this.dataServer.getEntity('playersAchievements');
        let created = await repository.create({
            player_id: playerId,
            achievement_id: Number(achievementId),
            status: ACHIEVEMENT_STATUS_ACTIVE,
            progress: '{}'
        });
        return Boolean(created);
    }

    /**
     * @param {number} playerId
     * @param {string} key
     * @returns {Promise<boolean>}
     */
    async increment(playerId, key)
    {
        for(let achievementId of Object.keys(this.achievementsById)){
            let achievement = this.achievementsById[achievementId];
            if(!this.matchesKey(achievement, key)){
                continue;
            }
            await this.ensureActive(playerId, achievementId);
            let progress = await this.progressForPlayer(playerId, achievementId);
            progress[key] = (progress[key] || 0) + 1;
            let row = await this.rowForPlayer(playerId, achievementId);
            let repository = this.dataServer.getEntity('playersAchievements');
            await repository.updateById(row.id, {progress: JSON.stringify(progress)});
            let completed = progress[key] >= achievement.quantity;
            await this.events.emit('reldens.achievements.progress', {
                playerId,
                achievement,
                current: progress[key],
                completed
            });
        }
        return true;
    }

    /**
     * @param {Object} achievement
     * @param {string} key
     * @returns {boolean}
     */
    matchesKey(achievement, key)
    {
        if(achievement.type !== key.split(':')[0]){
            return false;
        }
        if(!achievement.targetKey){
            return true;
        }
        return key.split(':')[1] === achievement.targetKey;
    }

    /**
     * @param {Object} achievement
     * @param {Object} playerSchema
     * @returns {Promise<boolean>}
     */
    async objectiveMet(achievement, playerSchema)
    {
        let progress = await this.progressForPlayer(playerSchema.player_id, achievement.id);
        let key = achievement.type+(achievement.targetKey ? ':'+achievement.targetKey : '');
        let current = progress[key] || 0;
        if(!achievement.targetKey && achievement.type === 'kill'){
            current = Object.values(progress).reduce((total, v) => total + v, 0);
        }
        return current >= achievement.quantity;
    }

    /**
     * @param {Object} achievement
     * @param {Object} playerSchema
     * @returns {Promise<Object>}
     */
    async claim(achievement, playerSchema)
    {
        let row = await this.rowForPlayer(playerSchema.player_id, achievement.id);
        if(!row || ACHIEVEMENT_STATUS_CLAIMED === row.status){
            return {success: false};
        }
        if(!await this.objectiveMet(achievement, playerSchema)){
            return {success: false};
        }
        let inventory = playerSchema.inventory.manager;
        if(achievement.rewardItemKey){
            let itemInstance = inventory.createItemInstance(achievement.rewardItemKey, 1);
            if(false === itemInstance){
                return {success: false};
            }
            let instances = !sc.isArray(itemInstance) ? [itemInstance] : itemInstance;
            let addResult = await inventory.addItems(instances);
            if(false === addResult){
                return {success: false};
            }
        }
        if(0 < achievement.rewardExp && playerSchema.skillsServer?.classPath?.addExperience){
            try {
                await playerSchema.skillsServer.classPath.addExperience(achievement.rewardExp);
            } catch (error) {
                Logger.error('AchievementManager: could not grant experience.', error.message);
            }
        }
        let repository = this.dataServer.getEntity('playersAchievements');
        await repository.updateById(row.id, {status: ACHIEVEMENT_STATUS_CLAIMED});
        await this.events.emit('reldens.achievements.claimed', {achievement, playerSchema});
        return {success: true};
    }

}

module.exports.AchievementManager = AchievementManager;
