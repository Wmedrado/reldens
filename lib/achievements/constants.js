/**
 *
 * Reldens - Achievements Constants
 *
 */

const TYPE_ACHIEVEMENT_BOARD = 'achievement';
const OPTION_OPEN = 'open';
const ACHIEVEMENT_STATUS_ACTIVE = 'active';
const ACHIEVEMENT_STATUS_CLAIMED = 'claimed';
const OBJECTIVE_KILL = 'kill';
const OBJECTIVE_GATHER = 'gather';
const OBJECTIVE_CRAFT = 'craft';
const OBJECTIVE_QUEST = 'quest';
const ACTION_CLAIM = 'achievement.claim';

const SNIPPETS = {
    OBJECT: {
        CONTENT: 'Achievements board.',
        OPTIONS: {
            OPEN: 'Open Achievements'
        }
    }
};

module.exports = {
    TYPE_ACHIEVEMENT_BOARD,
    OPTION_OPEN,
    ACHIEVEMENT_STATUS_ACTIVE,
    ACHIEVEMENT_STATUS_CLAIMED,
    OBJECTIVE_KILL,
    OBJECTIVE_GATHER,
    OBJECTIVE_CRAFT,
    OBJECTIVE_QUEST,
    ACTION_CLAIM,
    SNIPPETS
};
