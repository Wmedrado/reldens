/**
 *
 * Reldens - Quests Constants
 *
 */

const TYPE_QUEST = 'quest';
const OPTION_ACCEPT = 'accept';
const OPTION_TURN_IN = 'turnin';
const QUEST_STATUS_ACTIVE = 'active';
const QUEST_STATUS_CLAIMED = 'claimed';
const OBJECTIVE_KILL = 'kill';
const OBJECTIVE_GATHER = 'gather';
const OBJECTIVE_CRAFT = 'craft';

const SNIPPETS = {
    OBJECT: {
        CONTENT: 'Choose an option.',
        OPTIONS: {
            ACCEPT: 'Quests',
            TURN_IN: 'Turn In'
        },
        ACCEPTED: 'Quest accepted!',
        NO_QUESTS: 'You have no available quests.',
        TURN_IN_NONE: 'You have no quests to turn in.',
        NOT_COMPLETED: 'Quest objectives not completed yet.',
        COMPLETED: 'Quest completed!'
    }
};

module.exports = {
    TYPE_QUEST,
    OPTION_ACCEPT,
    OPTION_TURN_IN,
    QUEST_STATUS_ACTIVE,
    QUEST_STATUS_CLAIMED,
    OBJECTIVE_KILL,
    OBJECTIVE_GATHER,
    OBJECTIVE_CRAFT,
    SNIPPETS
};
