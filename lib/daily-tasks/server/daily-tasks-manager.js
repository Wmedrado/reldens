/**
 *
 * Reldens - DailyTasksManager
 *
 * Pixels-style daily task board: tasks reset every day (tracked by date) and
 * each task can be claimed once per day. Definitions live on the
 * "daily_tasks" table, progress on "players_daily_tasks".
 *
 */

const {
    TASK_STATUS_ACTIVE,
    TASK_STATUS_CLAIMED
} = require('../constants');
const { EventsManagerSingleton, Logger, sc } = require('@reldens/utils');

class DailyTasksManager
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
        this.tasksById = {};
    }

    /**
     * @returns {string}
     */
    today()
    {
        return new Date().toISOString().slice(0, 10);
    }

    /**
     * @returns {Promise<void>}
     */
    async loadTasks()
    {
        let repository = this.dataServer.getEntity('dailyTasks');
        if(!repository){
            Logger.error('DailyTasksManager: "dailyTasks" entity not found, run "reldens generateEntities".');
            return;
        }
        let rows = await repository.loadByWithRelations('is_active', 1);
        for(let row of rows){
            this.tasksById[row.id] = {
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
     * @param {string} taskDate
     * @returns {Promise<Object|null>}
     */
    async rowForPlayer(playerId, taskId, taskDate)
    {
        let repository = this.dataServer.getEntity('playersDailyTasks');
        return await repository.loadOne({
            player_id: playerId,
            task_id: Number(taskId),
            task_date: taskDate
        });
    }

    /**
     * @param {number} playerId
     * @param {string} taskDate
     * @returns {Promise<Object>}
     */
    async progressForPlayer(playerId, taskId, taskDate)
    {
        let row = await this.rowForPlayer(playerId, taskId, taskDate);
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
     * @param {number} playerId
     * @param {string} key
     * @returns {Promise<boolean>}
     */
    async increment(playerId, key)
    {
        let taskDate = this.today();
        for(let taskId of Object.keys(this.tasksById)){
            let task = this.tasksById[taskId];
            if(!this.matchesKey(task, key)){
                continue;
            }
            let row = await this.rowForPlayer(playerId, taskId, taskDate);
            if(row && TASK_STATUS_CLAIMED === row.status){
                continue;
            }
            if(!row){
                let repository = this.dataServer.getEntity('playersDailyTasks');
                row = await repository.create({
                    player_id: playerId,
                    task_id: Number(taskId),
                    task_date: taskDate,
                    status: TASK_STATUS_ACTIVE,
                    progress: '{}'
                });
            }
            let progress = await this.progressForPlayer(playerId, taskId, taskDate);
            progress[key] = (progress[key] || 0) + 1;
            let repository = this.dataServer.getEntity('playersDailyTasks');
            await repository.updateById(row.id, {progress: JSON.stringify(progress)});
        }
        return true;
    }

    /**
     * @param {Object} task
     * @param {string} key
     * @returns {boolean}
     */
    matchesKey(task, key)
    {
        if(task.type !== key.split(':')[0]){
            return false;
        }
        if(!task.targetKey){
            return true;
        }
        return key.split(':')[1] === task.targetKey;
    }

    /**
     * @param {Object} task
     * @param {Object} playerSchema
     * @param {string} taskDate
     * @returns {Promise<boolean>}
     */
    async objectiveMet(task, playerSchema, taskDate)
    {
        let progress = await this.progressForPlayer(playerSchema.player_id, task.id, taskDate);
        let key = task.type+(task.targetKey ? ':'+task.targetKey : '');
        let current = progress[key] || 0;
        if(!task.targetKey){
            current = Object.values(progress).reduce((t, v) => t + v, 0);
        }
        return current >= task.quantity;
    }

    /**
     * @param {Object} task
     * @param {Object} playerSchema
     * @returns {Promise<Object>}
     */
    async claim(task, playerSchema)
    {
        let taskDate = this.today();
        let row = await this.rowForPlayer(playerSchema.player_id, task.id, taskDate);
        if(!row || TASK_STATUS_CLAIMED === row.status){
            return {success: false};
        }
        if(!await this.objectiveMet(task, playerSchema, taskDate)){
            return {success: false};
        }
        let inventory = playerSchema.inventory.manager;
        if(task.rewardItemKey){
            let itemInstance = inventory.createItemInstance(task.rewardItemKey, 1);
            if(false === itemInstance){
                return {success: false};
            }
            let instances = !sc.isArray(itemInstance) ? [itemInstance] : itemInstance;
            let addResult = await inventory.addItems(instances);
            if(false === addResult){
                return {success: false};
            }
        }
        if(0 < task.rewardExp && playerSchema.skillsServer?.classPath?.addExperience){
            try {
                await playerSchema.skillsServer.classPath.addExperience(task.rewardExp);
            } catch (error) {
                Logger.error('DailyTasksManager: could not grant experience.', error.message);
            }
        }
        let repository = this.dataServer.getEntity('playersDailyTasks');
        await repository.updateById(row.id, {status: TASK_STATUS_CLAIMED});
        await this.events.emit('reldens.dailyTasks.taskClaimed', {task, playerSchema});
        return {success: true};
    }

}

module.exports.DailyTasksManager = DailyTasksManager;
