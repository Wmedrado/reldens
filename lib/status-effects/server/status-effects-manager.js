/**
 *
 * Reldens - StatusEffectsManager
 *
 * Applies timed status effects (damage/heal over time, buffs, debuffs) on any
 * target that exposes a "stats" map keyed by stat key. Each effect runs on its
 * own interval and modifies the target stat every tick. Only one instance per
 * (target, effect key) is allowed at a time.
 *
 */

const { Logger, sc } = require('@reldens/utils');

class StatusEffectsManager
{

    constructor()
    {
        /** @type {Object<string, Object>} */
        this.activeEffects = {};
    }

    /**
     * @param {Object} props
     * @param {Object} props.target
     * @param {string} props.key
     * @param {string} [props.label]
     * @param {string} props.propertyKey
     * @param {number} props.perTick
     * @param {number} [props.ticks]
     * @param {number} [props.intervalMs]
     * @param {Function} [props.onTick]
     * @param {Function} [props.onEnd]
     * @returns {Promise<Object|false>}
     */
    async applyEffect(props)
    {
        let target = sc.get(props, 'target', false);
        let key = sc.get(props, 'key', false);
        let propertyKey = sc.get(props, 'propertyKey', false);
        if(!target || !key || !propertyKey){
            Logger.error('StatusEffectsManager: missing target, key or propertyKey.');
            return false;
        }
        if(!sc.hasOwn(target, 'stats')){
            Logger.error('StatusEffectsManager: target does not expose "stats".');
            return false;
        }
        let ticks = Number(sc.get(props, 'ticks', 1) || 1);
        let intervalMs = Number(sc.get(props, 'intervalMs', 1000) || 1000);
        let perTick = Number(sc.get(props, 'perTick', 0) || 0);
        let effectKey = this.effectKey(target, key);
        await this.removeEffect(target, key);
        let effect = {
            key,
            label: sc.get(props, 'label', key),
            propertyKey,
            perTick,
            ticks,
            tick: 0,
            intervalMs,
            onTick: sc.get(props, 'onTick', false),
            onEnd: sc.get(props, 'onEnd', false),
            timer: setInterval(() => {
                this.tick(effect);
            }, intervalMs),
            target,
            removeKey: effectKey
        };
        this.activeEffects[effectKey] = effect;
        return effect;
    }

    /**
     * @param {Object} effect
     * @returns {Promise<boolean>}
     */
    async tick(effect)
    {
        let target = effect.target;
        let stats = target.stats;
        let propertyKey = effect.propertyKey;
        let current = Number(sc.get(stats, propertyKey, 0) || 0);
        let newValue = current + effect.perTick;
        let statsBase = sc.get(target, 'statsBase', {}) || {};
        let max = Number(sc.get(statsBase, propertyKey, Infinity));
        if(Number.isFinite(max)){
            newValue = Math.min(max, Math.max(0, newValue));
        } else {
            newValue = Math.max(0, newValue);
        }
        stats[propertyKey] = newValue;
        effect.tick++;
        if(sc.isFunction(effect.onTick)){
            await effect.onTick({target, effect, current: newValue});
        }
        if(effect.tick >= effect.ticks){
            await this.finish(effect);
        }
        return true;
    }

    /**
     * @param {Object} effect
     * @returns {Promise<boolean>}
     */
    async finish(effect)
    {
        this.clearTimer(effect);
        delete this.activeEffects[effect.removeKey];
        if(sc.isFunction(effect.onEnd)){
            await effect.onEnd({target: effect.target, effect});
        }
        return true;
    }

    /**
     * @param {Object} target
     * @param {string} key
     * @returns {boolean}
     */
    async removeEffect(target, key)
    {
        let effectKey = this.effectKey(target, key);
        let effect = sc.get(this.activeEffects, effectKey, false);
        if(!effect){
            return false;
        }
        await this.finish(effect);
        return true;
    }

    /**
     * @param {Object} target
     * @param {string} key
     * @returns {string}
     */
    effectKey(target, key)
    {
        let targetId = sc.get(target, 'uid', sc.get(target, 'player_id', sc.get(target, 'sessionId', 'unknown')));
        return targetId+'.'+key;
    }

    /**
     * @param {Object} effect
     */
    clearTimer(effect)
    {
        if(effect.timer){
            clearInterval(effect.timer);
            effect.timer = false;
        }
    }

    /**
     * Stop every active effect.
     */
    dispose()
    {
        for(let key of Object.keys(this.activeEffects)){
            this.clearTimer(this.activeEffects[key]);
        }
        this.activeEffects = {};
    }

}

module.exports.StatusEffectsManager = StatusEffectsManager;
