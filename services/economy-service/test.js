/**
 *
 * Reldens - Economy Service Self-Test
 *
 * Boots the store against a throwaway temp ledger and asserts the balance,
 * delta, idempotency and history logic. No HTTP server is started; run with:
 *
 *   node services/economy-service/test.js
 *
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { EconomyStore } = require('./store');

async function run()
{
    let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'economy-store-'));
    let ledgerPath = path.join(tmpDir, 'ledger.json');
    let store = new EconomyStore(ledgerPath);

    assert.strictEqual(store.getBalance(1), 0, 'fresh account balance is 0');

    let bal = await store.addDelta(1, 500, 'grant', 'ref-grant');
    assert.strictEqual(bal, 500, 'credit applies');
    assert.strictEqual(store.getBalance(1), 500, 'balance persists in memory');

    bal = await store.addDelta(1, -125, 'spend', 'ref-spend');
    assert.strictEqual(bal, 375, 'debit applies');

    let overdraft = await store.addDelta(1, -999999, 'spend', 'ref-over');
    assert.strictEqual(overdraft, false, 'overdraft rejected');

    let history = store.getHistory(1);
    assert.strictEqual(history.length, 2, 'history has the two applied deltas');
    assert.strictEqual(history[0].delta, 500, 'first entry delta');
    assert.strictEqual(history[1].reason, 'spend', 'second entry reason');
    assert.strictEqual(history[1].ref, 'ref-spend', 'second entry ref');
    assert.strictEqual(typeof history[1].entryId, 'string', 'entryId is a string');
    assert.strictEqual(typeof history[1].atMs, 'number', 'atMs is a number');

    assert.strictEqual(store.getHistory(2).length, 0, 'other account history is empty');

    assert.strictEqual(store.hasIdempotency('k1'), false, 'fresh idempotency key is free');
    await store.recordIdempotency('k1', {ok: true});
    assert.strictEqual(store.hasIdempotency('k1'), true, 'idempotency key recorded');
    assert.deepStrictEqual(store.getIdempotency('k1'), {ok: true}, 'idempotency result round-trips');

    assert.deepStrictEqual(store.ownedItems(3), {}, 'fresh account owns nothing');
    let owned = await store.grantItem(3, 'potion');
    assert.strictEqual(owned, 1, 'first grant returns count 1');
    owned = await store.grantItem(3, 'potion');
    assert.strictEqual(owned, 2, 'second grant returns count 2');
    assert.deepStrictEqual(store.ownedItems(3), {potion: 2}, 'owned map reflects grants');

    await store.persist();
    let reloaded = new EconomyStore(ledgerPath);
    assert.strictEqual(reloaded.getBalance(1), 375, 'ledger survives reload');
    assert.strictEqual(reloaded.getHistory(1).length, 2, 'history survives reload');
    assert.strictEqual(reloaded.hasIdempotency('k1'), true, 'idempotency survives reload');
    assert.deepStrictEqual(reloaded.ownedItems(3), {potion: 2}, 'owned survives reload');

    fs.rmSync(tmpDir, {recursive: true, force: true});
    console.log('economy store self-test passed');
}

run().catch((error) => {
    console.error('economy store self-test failed:', error.message);
    process.exit(1);
});
