/**
 *
 * Reldens - AchievementBoardObject
 *
 * Interactive achievements board. Shows the player achievements with progress
 * and lets them claim the completed ones.
 *
 */

const { NpcObject } = require('../../objects/server/object/type/npc-object');
const { GameConst } = require('../../game/constants');
const { AchievementManager } = require('./achievement-manager');
const {
    TYPE_ACHIEVEMENT_BOARD,
    OPTION_OPEN,
    ACTION_CLAIM,
    ACHIEVEMENT_STATUS_CLAIMED,
    SNIPPETS
} = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../users/server/player').Player} Player
 */
class AchievementBoardObject extends NpcObject
{

    /**
     * @param {Object} props
     */
    constructor(props)
    {
        super(props);
        this.type = TYPE_ACHIEVEMENT_BOARD;
        this.eventsPrefix = this.uid+'.achievement';
        this.clientParams.type = TYPE_ACHIEVEMENT_BOARD;
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
            Logger.error('AchievementBoardObject: Data Server was not specified.');
            return;
        }
        this.manager = new AchievementManager({dataServer});
        await this.manager.loadAchievements();
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
            let achievement = sc.get(this.manager.achievementsById, data.achievementId, false);
            if(achievement){
                await this.manager.claim(achievement, playerSchema);
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
        let achievements = [];
        for(let achievementId of Object.keys(this.manager.achievementsById)){
            let achievement = this.manager.achievementsById[achievementId];
            let progress = await this.manager.progressForPlayer(playerSchema.player_id, achievement.id);
            let current = achievement.targetKey
                ? (progress[achievement.type+':'+achievement.targetKey] || 0)
                : Object.values(progress).reduce((t, v) => t + v, 0);
            let row = await this.manager.rowForPlayer(playerSchema.player_id, achievement.id);
            achievements.push({
                id: achievement.id,
                code: achievement.code,
                label: achievement.label,
                description: achievement.description,
                type: achievement.type,
                current,
                quantity: achievement.quantity,
                claimed: Boolean(row && ACHIEVEMENT_STATUS_CLAIMED === row.status),
                met: current >= achievement.quantity
            });
        }
        client.send('*', {
            act: GameConst.UI,
            id: this.id,
            result: {achievements, boardId: this.id},
            listener: 'achievement'
        });
        return true;
    }

}

module.exports.AchievementBoardObject = AchievementBoardObject;
