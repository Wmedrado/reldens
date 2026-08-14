/**
 *
 * Reldens - Gathering Constants
 *
 */

const TYPE_GATHERING = 'gathering';
const OPTION_GATHER = 'gather';

const SNIPPETS = {
    OBJECT: {
        CONTENT: 'A gatherable resource.',
        OPTIONS: {
            GATHER: 'Gather'
        },
        LEVEL_TOO_LOW: 'Your level is too low to gather this resource.',
        BUSY: 'Already gathering, wait a moment.',
        COOLDOWN: 'This resource is depleted, come back later.',
        NO_RESOURCE: 'There is nothing to gather here.',
        SUCCESS: 'You gathered: '
    }
};

module.exports = {
    TYPE_GATHERING,
    OPTION_GATHER,
    SNIPPETS
};
