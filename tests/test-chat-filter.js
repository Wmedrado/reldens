/**
 *
 * Reldens - test-chat-filter
 *
 * Standalone tests for lib/chat/server/profanity-filter.js (no DB, no framework).
 * Run: node tests/test-chat-filter.js
 *
 */

const assert = require('assert');
const {
    DEFAULT_ESCALATION,
    cleanEscalationConfig,
    escalate,
    findHardWord,
    foldConfusables,
    maskText,
    normalizeWord,
    parseWordList,
} = require('../lib/chat/server/profanity-filter');

let passed = 0;

function ok(condition, label)
{
    assert.ok(condition, label);
    passed++;
}

function eq(actual, expected, label)
{
    assert.deepStrictEqual(actual, expected, label);
    passed++;
}

// This repository is open source and intentionally contains NO plaintext
// slurs. The hard tier's wordlist is operator-seeded at runtime (never in the
// repo); these fixtures are base64-encoded and decoded only at runtime so the
// filter can be exercised against genuine offensive input without the repo
// carrying it.
const dec = (b64) => Buffer.from(b64, 'base64').toString('utf8');
const F = {
    slur: dec('bmlnZ2Vy'),
    slurPlural: dec('bmlnZ2Vycw=='),
    affixMan: dec('bmlnZ2VybWFu'),
    affix2: dec('bmlnZ2VyZmFnZ290'),
    leet: dec('bjFnZzNy'),
    upper: dec('TklHR0VS'),
    atSign: dec('bmlnZ0A='),
    sixes: dec('bmk2NkA='),
    diacritic9: dec('bsOuOTllcg=='),
    diacritic2: dec('Y2jDrm5r'),
    circled: dec('4pOd4pOY4pOW4pOW4pOU4pOh'),
    math: dec('8J2Tt/Cdk7LwnZOw8J2TsPCdk67wnZO7'),
    fullwidth: dec('bmnvvYfvvYdlcg=='),
    variant2: dec('bmVncm9pZA=='),
    gap1: dec('Z29vaw=='), // an operator-seeded slur
    gap2: dec('d2V0YmFjaw=='),
    benign: dec('c25pZ2dlcg=='), // a real, non-slur word that embeds the slur
};

// foldConfusables
eq(foldConfusables(F.diacritic9), F.slur, 'foldConfusables de-obfuscates nî99er');
eq(foldConfusables(F.atSign), 'nigga', 'foldConfusables de-obfuscates nigg@ (keeps letters, folds @)');

// normalizeWord
eq(normalizeWord(F.upper.replace(/I/g, '1').replace(/E/g, '3')), F.slur, 'leet + case');
eq(normalizeWord('f.u_c-k'), 'fuck', 'punctuation stripped');
eq(normalizeWord('@$$'), 'ass', '@->a, $->s');
eq(normalizeWord('123'), 'ie', '1->i, 2 dropped, 3->e');

// parseWordList
eq(parseWordList('Fuck, sh1t\n bitch'), ['fuck', 'shit', 'bitch'], 'splits + normalizes');
eq(parseWordList('   '), [], 'blank blob yields empty list');

// maskText (soft, cosmetic)
eq(maskText('oh shit really', ['shit']), 'oh **** really', 'masks token, preserves length');
eq(maskText('that is shitty', ['shit']), 'that is ******', 'substring match');
eq(maskText('sh1t', ['shit']), '****', 'leet evasion masked');
eq(maskText('anything goes', []), 'anything goes', 'no terms, unchanged');

// findHardWord (hard, punitive — the admin hard list is the SOLE trigger)
eq(findHardWord(`you are a ${F.slur}`, [F.slur]), F.slur, 'plain listed word');
eq(findHardWord(F.leet, [F.slur]), F.slur, 'n1gg3r -> listed word');
eq(findHardWord(F.upper, [F.slur]), F.slur, 'case-insensitive');
eq(findHardWord(`two ${F.slurPlural} here`, [F.slur]), F.slur, 'trailing-s plural');
eq(findHardWord(F.diacritic9, [F.slur]), F.slur, 'accent + 9-as-g');
eq(findHardWord(F.math, [F.slur]), F.slur, 'mathematical-script glyphs');
eq(findHardWord(F.fullwidth, [F.slur]), F.slur, 'fullwidth glyphs');

eq(findHardWord(F.slur, []), null, 'empty list enforces nothing (1)');
eq(findHardWord(F.affixMan, []), null, 'empty list enforces nothing (2)');
eq(findHardWord('anything goes', []), null, 'empty list enforces nothing (3)');

eq(findHardWord(F.benign, [F.slur]), null, 'snigger embeds slur but is whole-token safe');
eq(findHardWord('what a classy pass', ['ass']), null, 'classy safe');
eq(findHardWord('assassin guild', ['ass']), null, 'assassin safe');
eq(findHardWord('that is despicable', ['spic']), null, 'despicable safe');
eq(findHardWord('perfectly fine message', [F.slur]), null, 'clean message safe');

eq(findHardWord(`you stupid ${F.affixMan}`, [F.slur]), null, 'affixed form not caught by bare listing');
eq(findHardWord(`what a ${F.variant2}`, [F.slur]), null, 'variant not caught by bare listing');
eq(findHardWord(F.affixMan, [F.affixMan]), F.affixMan, 'operator-listed variant matches');
eq(findHardWord(`what a ${F.variant2}`, [F.variant2]), F.variant2, 'operator-listed variant matches (2)');

eq(findHardWord(`go away ${F.gap1}`, [F.gap1]), F.gap1, 'operator-seeded word');
eq(findHardWord(`${F.gap2}s`, [F.gap2]), F.gap2, 'plural strip on operator-seeded word');

// escalate
const cfg = {warningsBeforeMute: 1, muteLadderSeconds: [600, 3600, 86400]};
eq(escalate(0, cfg), {kind: 'warning', muteSeconds: 0, strikes: 1}, 'first offense warns');
eq(escalate(1, cfg), {kind: 'mute', muteSeconds: 600, strikes: 2}, 'second offense mutes 10m');
eq(escalate(2, cfg), {kind: 'mute', muteSeconds: 3600, strikes: 3}, 'third offense mutes 1h');
eq(escalate(3, cfg), {kind: 'mute', muteSeconds: 86400, strikes: 4}, 'fourth offense mutes 24h');
eq(escalate(9, cfg), {kind: 'mute', muteSeconds: 86400, strikes: 10}, 'clamps at ladder end');
eq(escalate(0, {warningsBeforeMute: 0, muteLadderSeconds: [600]}), {
    kind: 'mute', muteSeconds: 600, strikes: 1,
}, 'mutes immediately when warningsBeforeMute is 0');
eq(escalate(5, {warningsBeforeMute: 1, muteLadderSeconds: []}), {
    kind: 'warning', muteSeconds: 0, strikes: 6,
}, 'never mutes when ladder empty');

// cleanEscalationConfig
eq(cleanEscalationConfig({}), DEFAULT_ESCALATION, 'garbage input falls back to defaults');
eq(cleanEscalationConfig({warningsBeforeMute: -3, muteLadderSeconds: 'nope'}), DEFAULT_ESCALATION, 'negative + non-array fall back');
eq(cleanEscalationConfig({warningsBeforeMute: 2, muteLadderSeconds: [60, -1, 0, 120]}), {
    warningsBeforeMute: 2,
    muteLadderSeconds: [60, 120],
}, 'keeps valid, drops non-positive ladder entries');

console.log('test-chat-filter OK ('+passed+' assertions).');
