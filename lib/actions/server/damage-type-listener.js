/**
 *
 * Reldens - DamageTypeListener
 *
 * Registers per player class path listeners that apply the damage type multiplier
 * to attack skills right before the damage is calculated, and restore the base
 * damage after the skill ran.
 *
 */

const { SkillsEvents } = require('@reldens/skills');
const { DamageTypes } = require('./damage-types');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('@reldens/utils').EventsManager} EventsManager
 */
class DamageTypeListener
{

    /**
     * Registers the global listener that attaches the damage type hooks to every
     * player class path once it is prepared.
     * @param {EventsManager} events
     * @returns {boolean}
     */
    static attach(events)
    {
        if(!events){
            Logger.error('EventsManager undefined in DamageTypeListener.');
            return false;
        }
        events.on(
            'reldens.actionsPrepareEventsListeners',
            (actionsPlugin, classPath) => this.attachClassPathListeners(classPath)
        );
        return true;
    }

    /**
     * @param {Object} classPath
     * @returns {boolean}
     */
    static attachClassPathListeners(classPath)
    {
        if(!classPath || !sc.isObjectFunction(classPath, 'listenEvent')){
            return false;
        }
        let ownerKey = classPath.getOwnerEventKey();
        classPath.listenEvent(
            SkillsEvents.SKILL_BEFORE_RUN_LOGIC,
            (skill) => DamageTypes.applyDamageTypeToSkill(skill),
            classPath.getOwnerUniqueEventKey('damageTypeBeforeLogic'),
            ownerKey
        );
        classPath.listenEvent(
            SkillsEvents.SKILL_AFTER_RUN_LOGIC,
            (skill) => DamageTypes.restoreDamageTypeFromSkill(skill),
            classPath.getOwnerUniqueEventKey('damageTypeAfterLogic'),
            ownerKey
        );
        return true;
    }

}

module.exports.DamageTypeListener = DamageTypeListener;
