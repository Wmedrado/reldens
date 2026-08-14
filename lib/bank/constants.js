/**
 *
 * Reldens - Bank Constants
 *
 */

const TYPE_BANKER = 'banker';
const OPTION_OPEN = 'open';
const ACTION_PREFIX = 'bank.';
const ACTION_LIST = ACTION_PREFIX+'list';
const ACTION_DEPOSIT = ACTION_PREFIX+'deposit';
const ACTION_WITHDRAW = ACTION_PREFIX+'withdraw';
const ACTION_RESULT = ACTION_PREFIX+'result';

const SNIPPETS = {
    OBJECT: {
        CONTENT: 'Welcome to the bank.',
        OPTIONS: {
            OPEN: 'Open Bank'
        },
        DEPOSIT_OK: 'Deposited.',
        WITHDRAW_OK: 'Withdrawn.',
        NOT_ENOUGH: 'Not enough items in the bank.',
        INVALID: 'Invalid operation.'
    }
};

module.exports = {
    TYPE_BANKER,
    OPTION_OPEN,
    ACTION_PREFIX,
    ACTION_LIST,
    ACTION_DEPOSIT,
    ACTION_WITHDRAW,
    ACTION_RESULT,
    SNIPPETS
};
