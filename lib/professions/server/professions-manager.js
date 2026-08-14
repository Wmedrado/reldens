/**
 *
 * Reldens - ProfessionsManager
 *
 * Pure logic + repository access for per-skill profession levels. The XP curve
 * is formula-based (data-driven through config) so the manager stays small and
 * every formula is unit-testable.
 *
 */

const { sc } = require('@reldens/utils');
const {
    DEFAULT_XP_BASE,
    DEFAULT_XP_MULTIPLIER
} = require('../constants');

const SKILLS_ENTITY = 'playersProfessionSkills';

class ProfessionsManager
{

    /**
     * @param {Object} props
     * @param {Object} props.dataServer
     * @param {Object} [props.config]
     */
    constructor(props)
    {
        this.dataServer = props.dataServer;
        this.config = sc.get(props, 'config', false);
        this.xpBase = this.getConfigNumber('server/professions/xpBase', DEFAULT_XP_BASE);
        this.xpMultiplier = this.getConfigNumber('server/professions/xpMultiplier', DEFAULT_XP_MULTIPLIER);
        this.playersProfessionSkillsRepository = this.dataServer.getEntity(SKILLS_ENTITY);
    }

    /**
     * @param {string} path
     * @param {number} fallback
     * @returns {number}
     */
    getConfigNumber(path, fallback)
    {
        if(!this.config){
            return fallback;
        }
        let value = Number(this.config.getWithoutLogs(path, fallback));
        return Number.isFinite(value) && value > 0 ? value : fallback;
    }

    /**
     * Cumulative XP required to REACH a level (level 1 = 0). Pure formula.
     * @param {number} level
     * @returns {number}
     */
    expRequiredForLevel(level)
    {
        level = Math.max(1, Math.floor(level));
        let total = 0;
        for(let i = 1; i < level; i++){
            total += Math.floor(this.xpBase * Math.pow(this.xpMultiplier, i - 1));
        }
        return total;
    }

    /**
     * Level derived from a cumulative XP amount. Pure formula.
     * @param {number} exp
     * @returns {number}
     */
    getLevelFromExp(exp)
    {
        exp = Math.max(0, Number(exp) || 0);
        let level = 1;
        while(this.expRequiredForLevel(level + 1) <= exp && level < 1000){
            level++;
        }
        return level;
    }

    /**
     * @param {number} playerId
     * @param {string} skillKey
     * @returns {Promise<Object|boolean>}
     */
    async loadSkill(playerId, skillKey)
    {
        let records = await this.playersProfessionSkillsRepository.loadBy('player_id', playerId);
        if(!sc.isArray(records)){
            return false;
        }
        let record = records.find(r => r.skill_key === skillKey);
        return record || false;
    }

    /**
     * @param {number} playerId
     * @param {string} skillKey
     * @returns {Promise<number>}
     */
    async getLevel(playerId, skillKey)
    {
        let record = await this.loadSkill(playerId, skillKey);
        if(!record){
            return 1;
        }
        return Number(record.current_level || 1);
    }

    /**
     * Adds experience to a profession skill and returns the result so the
     * plugin can fire events / notify the client. Persistence is idempotent
     * (upsert by player_id + skill_key).
     * @param {Object} playerSchema
     * @param {string} skillKey
     * @param {number} amount
     * @returns {Promise<Object|boolean>}
     */
    async addExperience(playerSchema, skillKey, amount)
    {
        if(!playerSchema?.player_id){
            return false;
        }
        amount = Math.max(0, Number(amount) || 0);
        if(0 === amount){
            return false;
        }
        let record = await this.loadSkill(playerSchema.player_id, skillKey);
        let previousExp = record ? Number(record.current_exp || 0) : 0;
        let previousLevel = record ? Number(record.current_level || 1) : 1;
        let newExp = previousExp + amount;
        let newLevel = this.getLevelFromExp(newExp);
        let data = {
            player_id: playerSchema.player_id,
            skill_key: skillKey,
            current_exp: newExp,
            current_level: newLevel
        };
        let saved;
        if(record){
            saved = await this.playersProfessionSkillsRepository.updateById(record.id, data);
        } else {
            saved = await this.playersProfessionSkillsRepository.create(data);
        }
        return {
            record: saved,
            skillKey,
            previousExp,
            newExp,
            previousLevel,
            newLevel,
            levelUp: newLevel > previousLevel
        };
    }

}

module.exports.ProfessionsManager = ProfessionsManager;
