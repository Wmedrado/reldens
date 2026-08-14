/**
 *
 * Reldens - ProfessionsPlugin
 *
 * Wires profession skill XP to existing gameplay events:
 *   - reldens.farming.harvestCompleted   -> farming
 *   - reldens.gathering.resourceGathered -> woodcutting/mining/fishing/foraging
 *   - reldens.crafting.recipeCompleted   -> crafting/cooking
 *
 * The manager persists per-skill XP and the plugin keeps the character class
 * level progressing too (dual progression).
 *
 */

const { ProfessionsManager } = require('./professions-manager');
const { GATHERING_SKILL_BY_CODE } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class ProfessionsPlugin
{

    /**
     * @param {Object} props
     * @param {Object} props.events
     * @param {Object} props.dataServer
     * @param {Object} [props.config]
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.events = sc.get(props, 'events', false);
        /** @type {ProfessionsManager} */
        this.manager = new ProfessionsManager({
            dataServer: props.dataServer,
            config: sc.get(props, 'config', false)
        });
    }

    /**
     * @returns {boolean}
     */
    setup()
    {
        if(!this.events){
            Logger.error('ProfessionsPlugin: EventsManager undefined.');
            return false;
        }
        this.events.on('reldens.farming.harvestCompleted', async (event) => {
            let amount = Number(sc.get(event, 'crop.expReward', 0) || 0);
            await this.grantExperience(event.playerSchema, 'farming', amount, event);
        });
        this.events.on('reldens.gathering.resourceGathered', async (event) => {
            let skillKey = this.getSkillKeyForResource(sc.get(event, 'resource.code', ''));
            let amount = Number(sc.get(event, 'resource.experience', 0) || 0);
            await this.grantExperience(event.playerSchema, skillKey, amount, event);
        });
        this.events.on('reldens.crafting.recipeCompleted', async (event) => {
            let amount = Number(sc.get(event, 'recipe.experience', 0) || 0);
            let skillKey = this.getCraftingSkillKey(sc.get(event, 'recipe', false));
            await this.grantExperience(event.playerSchema, skillKey, amount, event);
        });
        return true;
    }

    /**
     * @param {Object} playerSchema
     * @param {string} skillKey
     * @param {number} amount
     * @param {Object} sourceEvent
     * @returns {Promise<boolean>}
     */
    async grantExperience(playerSchema, skillKey, amount, sourceEvent)
    {
        if(!playerSchema || !skillKey || amount <= 0){
            return false;
        }
        try {
            let result = await this.manager.addExperience(playerSchema, skillKey, amount);
            if(false === result){
                return false;
            }
            if(result.levelUp){
                await this.events.emit('reldens.professions.levelUp', {
                    playerSchema,
                    skillKey,
                    level: result.newLevel,
                    previousLevel: result.previousLevel,
                    sourceEvent
                });
            }
            await this.events.emit('reldens.professions.experienceAdded', result);
            return true;
        } catch (error) {
            Logger.error('ProfessionsPlugin: could not grant experience.', skillKey, error.message);
            return false;
        }
    }

    /**
     * Maps a gathering resource code prefix to a profession skill key.
     * @param {string} resourceCode
     * @returns {string}
     */
    getSkillKeyForResource(resourceCode)
    {
        let code = String(resourceCode || '').toLowerCase();
        for(let prefix of Object.keys(GATHERING_SKILL_BY_CODE)){
            if(code.startsWith(prefix)){
                return GATHERING_SKILL_BY_CODE[prefix];
            }
        }
        return 'woodcutting';
    }

    /**
     * @param {Object|boolean} recipe
     * @returns {string}
     */
    getCraftingSkillKey(recipe)
    {
        if(recipe && recipe.skill_id){
            // skill_id references skills_skill; default to crafting when unknown:
            return 'crafting';
        }
        return 'crafting';
    }

}

module.exports.ProfessionsPlugin = ProfessionsPlugin;
