/**
 *
 * Reldens - test-linkdead
 *
 * Standalone tests for the pure linkdead join-plan decision core.
 *
 */

const assert = require('assert');
const { Linkdead } = require('../lib/rooms/server/linkdead');

const { LINKDEAD_GRACE_MS, planJoin } = Linkdead;

assert.strictEqual(LINKDEAD_GRACE_MS, 5 * 60 * 1000, 'grace window is 5 minutes');

// A session that is linkdead, owned by the requesting account, not mid-teardown
// and not escrow-quarantined resumes.
assert.deepStrictEqual(
    planJoin({
        accountId: 1,
        isGm: false,
        sameCharacter: {accountId: 1, linkdead: true, left: false, escrowQuarantined: false},
        liveOtherSessions: 0,
        maxPerAccount: 2
    }),
    {action: 'resume'}
);

// Linkdead but leave() already began: must never resume.
assert.deepStrictEqual(
    planJoin({
        accountId: 1,
        isGm: false,
        sameCharacter: {accountId: 1, linkdead: true, left: true, escrowQuarantined: false},
        liveOtherSessions: 0,
        maxPerAccount: 2
    }),
    {action: 'reject', error: 'character already in world'}
);

// Live socket on the same character: reject (takeover flow only).
assert.deepStrictEqual(
    planJoin({
        accountId: 1,
        isGm: false,
        sameCharacter: {accountId: 1, linkdead: false, left: false, escrowQuarantined: false},
        liveOtherSessions: 0,
        maxPerAccount: 2
    }),
    {action: 'reject', error: 'character already in world'}
);

// Escrow-quarantined: reject so the refused client retries into a fresh join.
assert.deepStrictEqual(
    planJoin({
        accountId: 1,
        isGm: false,
        sameCharacter: {accountId: 1, linkdead: true, left: false, escrowQuarantined: true},
        liveOtherSessions: 0,
        maxPerAccount: 2
    }),
    {action: 'reject', error: 'character already in world'}
);

// A linkdead session owned by a DIFFERENT account must never resume.
assert.deepStrictEqual(
    planJoin({
        accountId: 1,
        isGm: false,
        sameCharacter: {accountId: 2, linkdead: true, left: false, escrowQuarantined: false},
        liveOtherSessions: 0,
        maxPerAccount: 2
    }),
    {action: 'reject', error: 'character already in world'}
);

// Different character: linkdead sessions never block; only live sessions count
// against the per-account cap.
assert.deepStrictEqual(
    planJoin({
        accountId: 1,
        isGm: false,
        sameCharacter: null,
        liveOtherSessions: 3,
        maxPerAccount: 2
    }),
    {action: 'reject', error: 'too many characters on this account are already in the world'}
);

// GM bypasses the per-account cap.
assert.deepStrictEqual(
    planJoin({
        accountId: 1,
        isGm: true,
        sameCharacter: null,
        liveOtherSessions: 3,
        maxPerAccount: 2
    }),
    {action: 'join'}
);

// Under the cap with no same-character session: join.
assert.deepStrictEqual(
    planJoin({
        accountId: 1,
        isGm: false,
        sameCharacter: null,
        liveOtherSessions: 1,
        maxPerAccount: 2
    }),
    {action: 'join'}
);

// At exactly the cap (non-GM): reject.
assert.deepStrictEqual(
    planJoin({
        accountId: 1,
        isGm: false,
        sameCharacter: null,
        liveOtherSessions: 2,
        maxPerAccount: 2
    }),
    {action: 'reject', error: 'too many characters on this account are already in the world'}
);

console.log('test-linkdead: all tests passed');
