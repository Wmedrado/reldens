/**
 *
 * Reldens - Status Effects Constants
 *
 */

const ACTION_PREFIX = 'status.';
const ACTION_APPLY = ACTION_PREFIX+'apply';
const ACTION_REMOVE = ACTION_PREFIX+'remove';
const ACTION_RESULT = ACTION_PREFIX+'result';
const EVENT_APPLY = 'reldens.statusEffects.apply';
const EVENT_REMOVE = 'reldens.statusEffects.remove';

module.exports = {
    ACTION_PREFIX,
    ACTION_APPLY,
    ACTION_REMOVE,
    ACTION_RESULT,
    EVENT_APPLY,
    EVENT_REMOVE
};
