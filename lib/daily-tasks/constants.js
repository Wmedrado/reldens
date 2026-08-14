/**
 *
 * Reldens - Daily Tasks Constants
 *
 */

const TYPE_TASK_BOARD = 'dailytask';
const OPTION_OPEN = 'open';
const TASK_STATUS_ACTIVE = 'active';
const TASK_STATUS_CLAIMED = 'claimed';
const OBJECTIVE_KILL = 'kill';
const OBJECTIVE_GATHER = 'gather';
const OBJECTIVE_CRAFT = 'craft';
const ACTION_CLAIM = 'dailytask.claim';

const SNIPPETS = {
    OBJECT: {
        CONTENT: 'Daily task board.',
        OPTIONS: {
            OPEN: 'Daily Tasks'
        }
    }
};

module.exports = {
    TYPE_TASK_BOARD,
    OPTION_OPEN,
    TASK_STATUS_ACTIVE,
    TASK_STATUS_CLAIMED,
    OBJECTIVE_KILL,
    OBJECTIVE_GATHER,
    OBJECTIVE_CRAFT,
    ACTION_CLAIM,
    SNIPPETS
};
