/**
 *
 * Reldens - Chests Constants
 *
 */

const TYPE_CHEST = 'chest';
const OPTION_OPEN = 'open';

const SNIPPETS = {
    OBJECT: {
        CONTENT: 'A chest. Open it to receive loot.',
        OPTIONS: {
            OPEN: 'Open'
        },
        OPENED: 'You opened the chest!',
        EMPTY: 'The chest is empty.',
        COOLDOWN: 'The chest is empty for now, come back later.',
        LOOT: 'You received: '
    }
};

module.exports = {
    TYPE_CHEST,
    OPTION_OPEN,
    SNIPPETS
};
