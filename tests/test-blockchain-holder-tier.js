/**
 *
 * Reldens - test-blockchain-holder-tier
 *
 * Standalone tests for the holder-tier ladder.
 *
 */

const assert = require('assert');
const {
    TOKEN_MAX_SUPPLY,
    HOLDER_TIER_DEFS,
    holderTierForBalance,
    holderTierIndexForBalance,
    holderTierByIndex,
    tierSupplyShare
} = require('../lib/blockchain/server/holder-tier');

try {
    // Ladder boundaries: 1, 10, 1e6, 1e9 map to rungs 1, 2, 7, 18.
    assert.strictEqual(holderTierIndexForBalance(1), 1);
    assert.strictEqual(holderTierIndexForBalance(10), 2);
    assert.strictEqual(holderTierIndexForBalance(1000000), 7);
    assert.strictEqual(holderTierIndexForBalance(1000000000), 18);

    // No wallet (null), zero, negative, and non-finite balances qualify for no rung.
    assert.strictEqual(holderTierIndexForBalance(null), 0);
    assert.strictEqual(holderTierIndexForBalance(0), 0);
    assert.strictEqual(holderTierIndexForBalance(-5), 0);
    assert.strictEqual(holderTierIndexForBalance(NaN), 0);

    // Between-rung values resolve to the highest reached rung.
    assert.strictEqual(holderTierForBalance(1).key, 'ember');
    assert.strictEqual(holderTierForBalance(9).key, 'ember');
    assert.strictEqual(holderTierForBalance(10).key, 'coinbearer');
    assert.strictEqual(holderTierForBalance(1000000).key, 'whale');
    assert.strictEqual(holderTierForBalance(999999999).key, 'worldbearer');
    assert.strictEqual(holderTierForBalance(TOKEN_MAX_SUPPLY).key, 'sovereign');

    // The ladder has 18 rungs, 1-based.
    assert.strictEqual(HOLDER_TIER_DEFS.length, 18);
    assert.strictEqual(HOLDER_TIER_DEFS[0].index, 1);
    assert.strictEqual(HOLDER_TIER_DEFS[17].index, 18);

    // holderTierByIndex: 0/out-of-range is undefined.
    assert.strictEqual(holderTierByIndex(0), undefined);
    assert.strictEqual(holderTierByIndex(19), undefined);
    assert.strictEqual(holderTierByIndex(-1), undefined);
    assert.strictEqual(holderTierByIndex(1).key, 'ember');
    assert.strictEqual(holderTierByIndex(18).key, 'sovereign');

    // tierSupplyShare: fraction of max supply in [0, 1].
    assert.strictEqual(tierSupplyShare(HOLDER_TIER_DEFS[0]), 1 / TOKEN_MAX_SUPPLY);
    assert.strictEqual(tierSupplyShare(HOLDER_TIER_DEFS[17]), 1);
    assert.strictEqual(tierSupplyShare(HOLDER_TIER_DEFS[7]), 10000000 / TOKEN_MAX_SUPPLY);

    console.log('test-blockchain-holder-tier: all tests passed');
} catch (err) {
    throw err;
}
