/**
 *
 * Reldens - DailyTaskBoardObject
 *
 * Interactive daily task board. Shows the daily tasks with progress and lets
 * the player claim the completed ones (once per day).
 *
 */

const { NpcObject } = require('../../objects/server/object/type/npc-object');
const { GameConst } = require('../../game/constants');
const { DailyTasksManager } = require('./daily-tasks-manager');
const {
    TYPE_TASK_BOARD,
    OPTION_OPEN,
    ACTION_CLAIM,
    TASK_STATUS_CLAIMED,
    SNIPPETS
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../users/server/player').Player} Player
 */
class DailyTaskBoardObject extends NpcObject
{

    /**
     * @param {Object} props
     */
    constructor(props)
    {
        super(props);
        this.type = TYPE_TASK_BOARD;
        this.eventsPrefix = this.uid+'.dailytask';
        this.clientParams.type = TYPE_TASK_BOARD;
        this.content = sc.get(this.clientParams, 'content', SNIPPETS.OBJECT.CONTENT);
        this.options = sc.get(this.clientParams, 'options', {
            [OPTION_OPEN]: {
                label: SNIPPETS.OBJECT.OPTIONS.OPEN,
                value: OPTION_OPEN
            }
        });
        this.manager = false;
    }

    /**
     * @param {Object} props
     * @returns {Promise<void>}
     */
    async runAdditionalSetup(props)
    {
        let dataServer = sc.get(props.objectsManager, 'dataServer', false);
        if(false === dataServer){
            Logger.error('DailyTaskBoardObject: Data Server was not specified.');
            return;
        }
        this.manager = new DailyTasksManager({dataServer});
        await this.manager.loadTasks();
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
        if(!this.manager){
            return false;
        }
        if(ACTION_CLAIM === sc.get(data, 'act', '')){
            let task = sc.get(this.manager.tasksById, data.taskId, false);
            if(task){
                await this.manager.claim(task, playerSchema);
            }
            return await this.openBoard(client, playerSchema);
        }
        if(OPTION_OPEN === sc.get(data, 'value', 'init')){
            return await this.openBoard(client, playerSchema);
        }
        return false;
    }

    /**
     * @param {Object} client
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async openBoard(client, playerSchema)
    {
        let taskDate = this.manager.today();
        let tasks = [];
        for(let taskId of Object.keys(this.manager.tasksById)){
            let task = this.manager.tasksById[taskId];
            let progress = await this.manager.progressForPlayer(playerSchema.player_id, task.id, taskDate);
            let current = task.targetKey
                ? (progress[task.type+':'+task.targetKey] || 0)
                : Object.values(progress).reduce((t, v) => t + v, 0);
            let row = await this.manager.rowForPlayer(playerSchema.player_id, task.id, taskDate);
            tasks.push({
                id: task.id,
                code: task.code,
                label: task.label,
                description: task.description,
                type: task.type,
                current,
                quantity: task.quantity,
                claimed: Boolean(row && TASK_STATUS_CLAIMED === row.status),
                met: current >= task.quantity
            });
        }
        client.send('*', {
            act: GameConst.UI,
            id: this.id,
            result: {tasks, boardId: this.id, date: taskDate},
            listener: 'dailytask'
        });
        return true;
    }

}

module.exports.DailyTaskBoardObject = DailyTaskBoardObject;
