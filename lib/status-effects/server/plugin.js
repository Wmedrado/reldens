/**
 *
 * Reldens - StatusEffectsPlugin
 *
 * Server-side plugin for the status effects feature. Registers the message
 * actions and exposes the "reldens.statusEffects.apply" and
 * "reldens.statusEffects.remove" events so any gameplay code (skills, enemies,
 * potions) can apply timed effects on any target.
 *
 */

const { StatusEffectsManager } = require('./status-effects-manager');
const { StatusEffectsMessageActions } = require('./message-actions');
const { EVENT_APPLY, EVENT_REMOVE } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class StatusEffectsPlugin
{

    /**
     * @param {Object} props
     * @param {Object} props.events
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.events = sc.get(props, 'events', false);
        /** @type {StatusEffectsManager} */
        this.manager = new StatusEffectsManager();
    }

    /**
     * @returns {boolean}
     */
    setup()
    {
        if(!this.events){
            Logger.error('StatusEffectsPlugin: EventsManager undefined.');
            return false;
        }
        this.events.on('reldens.roomsMessageActionsGlobal', (roomMessageActions) => {
            roomMessageActions.statusEffects = new StatusEffectsMessageActions({manager: this.manager});
        });
        this.events.on(EVENT_APPLY, async (props) => {
            let target = sc.get(props, 'target', false);
            if(!target){
                return false;
            }
            return await this.manager.applyEffect(props);
        });
        this.events.on(EVENT_REMOVE, async (props) => {
            let target = sc.get(props, 'target', false);
            let key = sc.get(props, 'key', false);
            if(!target || !key){
                return false;
            }
            return await this.manager.removeEffect(target, key);
        });
        return true;
    }

}

module.exports.StatusEffectsPlugin = StatusEffectsPlugin;
