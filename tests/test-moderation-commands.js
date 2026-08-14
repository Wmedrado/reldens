/**
 *
 * Reldens - test-moderation-commands
 *
 * Standalone tests for lib/chat/server/moderation-commands.js (no DB, no framework).
 * Run: node tests/test-moderation-commands.js
 *
 */

const assert = require('assert');
const {
    MODERATION_COMMAND_MINUTES_MAX,
    MODERATION_COMMAND_REASON_MAX,
    parseModerationChatCommand,
} = require('../lib/chat/server/moderation-commands');

let passed = 0;

function eq(actual, expected, label)
{
    assert.deepStrictEqual(actual, expected, label);
    passed++;
}

function ok(condition, label)
{
    assert.ok(condition, label);
    passed++;
}

// reason-only commands and bounded reasons
eq(parseModerationChatCommand('  /kick   "Mira Sun" griefing in chat  '), {
    kind: 'kick',
    name: 'Mira Sun',
    reason: 'griefing in chat',
}, 'kick parses quoted name + reason');
eq(parseModerationChatCommand('/kill "Kael\'thas" spawn camping'), {
    kind: 'kill',
    name: "Kael'thas",
    reason: 'spawn camping',
}, 'kill parses apostrophe in name');
eq(parseModerationChatCommand('/forcerename "Bad Name" offensive name'), {
    kind: 'forcerename',
    name: 'Bad Name',
    reason: 'offensive name',
}, 'forcerename parses');
eq(parseModerationChatCommand('/ban "Repeat" repeat offender'), {
    kind: 'ban',
    name: 'Repeat',
    reason: 'repeat offender',
}, 'ban parses');
eq(parseModerationChatCommand('/kick "Mira Sun"'), {
    kind: 'kick',
    name: 'Mira Sun',
    reason: 'No reason specified',
}, 'kick defaults reason');
eq(parseModerationChatCommand('/ban "Repeat"'), {
    kind: 'ban',
    name: 'Repeat',
    reason: 'No reason specified',
}, 'ban defaults reason');
let bounded = parseModerationChatCommand(`/kick "Mira Sun" ${'x'.repeat(800)}`);
ok(bounded && 'reason' in bounded && bounded.reason.length === MODERATION_COMMAND_REASON_MAX,
    'reason bounded to MODERATION_COMMAND_REASON_MAX');

// timed commands, invalid durations preserved for policy validation
eq(parseModerationChatCommand('/mute "Mira Sun" 5 spamming the market'), {
    kind: 'mute',
    name: 'Mira Sun',
    minutes: 5,
    reason: 'spamming the market',
}, 'mute with minutes + reason');
eq(parseModerationChatCommand('/mute "Mira Sun" 5'), {
    kind: 'mute',
    name: 'Mira Sun',
    minutes: 5,
    reason: 'No reason specified',
}, 'mute with minutes only');
eq(parseModerationChatCommand('  /suspend "Mira Sun"  60   cheating '), {
    kind: 'suspend',
    name: 'Mira Sun',
    minutes: 60,
    reason: 'cheating',
}, 'suspend tolerates extra whitespace');
eq(parseModerationChatCommand('/mute "Mira Sun" abc spamming'), {
    kind: 'mute',
    name: 'Mira Sun',
    minutes: null,
    reason: 'spamming',
}, 'non-numeric minutes preserved as null');
eq(parseModerationChatCommand('/suspend "Mira Sun" 0 cheating'), {
    kind: 'suspend',
    name: 'Mira Sun',
    minutes: null,
    reason: 'cheating',
}, 'zero minutes preserved as null');
eq(parseModerationChatCommand(`/suspend "Mira Sun" ${MODERATION_COMMAND_MINUTES_MAX + 1} cheating`), {
    kind: 'suspend',
    name: 'Mira Sun',
    minutes: null,
    reason: 'cheating',
}, 'minutes above cap preserved as null');

// unquoted targets rejected
eq(parseModerationChatCommand('/kick griefing in chat'), {
    kind: 'kick',
    name: null,
    reason: 'No reason specified',
}, 'unquoted kick target -> null name, default reason');
eq(parseModerationChatCommand('/kill "Mira Sun'), {
    kind: 'kill',
    name: null,
    reason: 'No reason specified',
}, 'unterminated quote -> null name');
eq(parseModerationChatCommand('/ban "" reason'), {
    kind: 'ban',
    name: null,
    reason: 'reason',
}, 'empty quoted name -> null name, reason kept');
eq(parseModerationChatCommand('/mute 5 spamming'), {
    kind: 'mute',
    name: null,
    minutes: null,
    reason: 'No reason specified',
}, 'unquoted mute target -> all null');

// spectate targets
eq(parseModerationChatCommand('/spectate Mira'), {kind: 'spectate', name: 'Mira'}, 'unquoted spectate');
eq(parseModerationChatCommand(' /SpEcTaTe   Mira Sun '), {kind: 'spectate', name: 'Mira Sun'}, 'case-insensitive unquoted spectate');
eq(parseModerationChatCommand(' /spectate   "Mira   Sun" '), {kind: 'spectate', name: 'Mira Sun'}, 'quoted spectate collapses spaces');
eq(parseModerationChatCommand('/spectate "Mira Sun" trailing'), {kind: 'spectate', name: null}, 'trailing text invalidates spectate');
eq(parseModerationChatCommand('/spectate'), {kind: 'spectate', name: null}, 'bare spectate');
eq(parseModerationChatCommand('/unspectate'), {kind: 'unspectate'}, 'bare unspectate');

// jail
let invalid = {kind: 'jail', name: null, minutes: null, reason: null, malformed: true};
eq(parseModerationChatCommand('/jail'), {
    kind: 'jail',
    name: null,
    minutes: null,
    reason: null,
    malformed: false,
}, 'bare jail = own visit, not malformed');
eq(parseModerationChatCommand('/jail "Mira Sun" 10'), {
    kind: 'jail',
    name: 'Mira Sun',
    minutes: 10,
    reason: null,
    malformed: false,
}, 'jail with minutes');
eq(parseModerationChatCommand('/jail "Mira Sun" 10 spamming chat'), {
    kind: 'jail',
    name: 'Mira Sun',
    minutes: 10,
    reason: 'spamming chat',
    malformed: false,
}, 'jail with bare reason');
eq(parseModerationChatCommand('/jail "Mira Sun" 10 "the reason"'), {
    kind: 'jail',
    name: 'Mira Sun',
    minutes: 10,
    reason: 'the reason',
    malformed: false,
}, 'jail with quoted reason');
eq(parseModerationChatCommand('/jail "Mira Sun"'), invalid, 'name without minutes malformed');
eq(parseModerationChatCommand('/jail Mira Sun'), invalid, 'unquoted jail target malformed');
eq(parseModerationChatCommand('/jail "Mira Sun" 0'), invalid, 'zero sentence malformed');
eq(parseModerationChatCommand('/jail "Mira Sun" soon'), invalid, 'non-numeric sentence malformed');
eq(parseModerationChatCommand('/jail "Mira Sun" 99999999999'), invalid, 'absurd sentence malformed');
eq(parseModerationChatCommand('/jail "Mira Sun" "the reason"'), invalid, 'reason without minutes malformed');
eq(parseModerationChatCommand('/unjail'), {
    kind: 'unjail',
    name: null,
    malformed: false,
}, 'bare unjail');
eq(parseModerationChatCommand('/unjail "Mira Sun"'), {
    kind: 'unjail',
    name: 'Mira Sun',
    malformed: false,
}, 'unjail with name');
eq(parseModerationChatCommand('/unjail "Mira Sun" trailing'), {
    kind: 'unjail',
    name: null,
    malformed: true,
}, 'unjail trailing text malformed');

// unrelated commands and near misses
eq(parseModerationChatCommand('/guild hello'), null, 'unrelated command ignored');
eq(parseModerationChatCommand('/kicker someone'), null, 'near miss ignored (1)');
eq(parseModerationChatCommand('/suspender someone'), null, 'near miss ignored (2)');
eq(parseModerationChatCommand('/spectator someone'), null, 'near miss ignored (3)');
eq(parseModerationChatCommand('/unspectate now'), null, 'near miss ignored (4)');
eq(parseModerationChatCommand('/jailer "Mira"'), null, 'near miss ignored (5)');
eq(parseModerationChatCommand('hello /kick'), null, 'command mid-sentence ignored');

console.log('test-moderation-commands OK ('+passed+' assertions).');
