/**
 *
 * Reldens - DamageTypes
 *
 * Combat damage types inspired by the Kaetram combat design (ported as pattern,
 * not code). Each attack uses a single damage type. Every target can define a
 * defense value per damage type so the attack is amplified (weakness) or reduced
 * (resistance).
 *
 * Supported target stat keys:
 * - `weak_<type>`: direct multiplier, 0.5 = resists 50%, 1.5 = takes 50% more.
 * - `def_<type>`: defense number, negative = weakness, positive = resistance.
 *
 */

const { Logger, sc } = require('@reldens/utils');

let damageTypes = ['crush', 'slash', 'stab', 'archery', 'magic'];

module.exports.DamageTypes = {

    TYPES: damageTypes,

    /**
     * @param {string} type
     * @returns {boolean}
     */
    isValidType(type)
    {
        return sc.isString(type) && damageTypes.includes(type);
    },

    /**
     * Extracts the damage type used by an attack skill. Skills define it through
     * the `damageType` field inside the customData column of the skill.
     * @param {Object} skill
     * @returns {string|boolean}
     */
    getSkillDamageType(skill)
    {
        let customData = sc.toJson(sc.get(skill, 'customData', false));
        if(!customData){
            return false;
        }
        let damageType = sc.get(customData, 'damageType', false);
        if(!this.isValidType(damageType)){
            Logger.debug('Undefined damage type in skill customData.', skill.key, damageType);
            return false;
        }
        return damageType;
    },

    /**
     * Calculates the damage multiplier for a given attack type against a target.
     * The target can be a plain stats object (Fase 1) or a game entity with a
     * `stats` map and/or a `damageTypes` map (Fase 2). When `damageTypes` is
     * present it has precedence over `stats`. Returns 1 when no damage data is
     * defined.
     * @param {string} attackType
     * @param {Object} target
     * @returns {number}
     */
    getDamageTypeMultiplier(attackType, target = {})
    {
        if(!this.isValidType(attackType) || !sc.isObject(target)){
            return 1;
        }
        let targetStats = this.getTargetDamageStats(target);
        let weakMultiplier = this.getWeaknessMultiplier(attackType, targetStats);
        if(false !== weakMultiplier){
            return weakMultiplier;
        }
        return this.getDefenseMultiplier(attackType, targetStats);
    },

    /**
     * Resolves the damage stats source of a target. A game entity can define a
     * `damageTypes` map (loaded from `objects_damage_types`, has precedence) or
     * use the generic `stats` map. Plain objects are returned as-is.
     * @param {Object} target
     * @returns {Object}
     */
    getTargetDamageStats(target)
    {
        if(sc.isObject(target.damageTypes)){
            return target.damageTypes;
        }
        if(sc.isObject(target.stats)){
            return target.stats;
        }
        return sc.isObject(target) ? target : {};
    },

    /**
     * @param {string} attackType
     * @param {Object} targetStats
     * @returns {number|false}
     */
    getWeaknessMultiplier(attackType, targetStats)
    {
        let weakKey = 'weak_'+attackType;
        if(!sc.hasOwn(targetStats, weakKey)){
            return false;
        }
        return Number(sc.get(targetStats, weakKey, 1));
    },

    /**
     * Converts a defense number into a multiplier. Negative defense (weakness)
     * increases the damage, positive defense (resistance) reduces it.
     * @param {string} attackType
     * @param {Object} targetStats
     * @returns {number}
     */
    getDefenseMultiplier(attackType, targetStats)
    {
        let defKey = 'def_'+attackType;
        if(!sc.hasOwn(targetStats, defKey)){
            return 1;
        }
        let defense = Number(sc.get(targetStats, defKey, 0));
        // cap the multiplier between 0.5 (strong resistance) and 1.5 (weakness):
        let multiplier = 1 - (defense * 0.1);
        if(multiplier > 1.5){
            return 1.5;
        }
        if(multiplier < 0.5){
            return 0.5;
        }
        return multiplier;
    },

    /**
     * Applies the damage type multiplier onto the skill hit damage. The original
     * value is stored so it can be restored after the skill runs.
     * @param {Object} skill
     * @returns {boolean}
     */
    applyDamageTypeToSkill(skill)
    {
        if(!skill || !sc.hasOwn(skill, 'hitDamage')){
            return false;
        }
        let damageType = this.getSkillDamageType(skill);
        if(false === damageType){
            return false;
        }
        let targetStats = skill.target || {};
        let multiplier = this.getDamageTypeMultiplier(damageType, targetStats);
        if(1 === multiplier){
            return false;
        }
        skill.__damageTypeOriginalHitDamage = skill.hitDamage;
        skill.hitDamage = skill.hitDamage * multiplier;
        return true;
    },

    /**
     * Restores the original hit damage after the skill finished running.
     * @param {Object} skill
     * @returns {boolean}
     */
    restoreDamageTypeFromSkill(skill)
    {
        if(!sc.hasOwn(skill, '__damageTypeOriginalHitDamage')){
            return false;
        }
        skill.hitDamage = skill.__damageTypeOriginalHitDamage;
        delete skill.__damageTypeOriginalHitDamage;
        return true;
    }

};
