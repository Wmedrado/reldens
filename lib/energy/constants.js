/**
 *
 * Reldens - Energy Constants
 *
 */

const STAT_KEY_ENERGY = 'energy';
const ACTION_PREFIX = 'energy.';
const ACTION_USE = ACTION_PREFIX+'use';
const ACTION_RESULT = ACTION_PREFIX+'result';
const DEFAULT_REGEN_PER_MINUTE = 3;
const DEFAULT_MAX_ENERGY = 100;

const SNIPPETS = {
    NOT_ENOUGH_ENERGY: 'Not enough energy.'
};

module.exports = {
    STAT_KEY_ENERGY,
    ACTION_PREFIX,
    ACTION_USE,
    ACTION_RESULT,
    DEFAULT_REGEN_PER_MINUTE,
    DEFAULT_MAX_ENERGY,
    SNIPPETS
};
