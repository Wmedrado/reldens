/**
 *
 * Reldens - test-economy-proxy
 *
 * Standalone tests for the economy service pass-through proxy. fetch is
 * injected so the tests need no live service and no network. Every function
 * must degrade to a typed unavailable result - never throw - whether the env
 * is unset, the service answers non-2xx, the network errors, or it times out.
 *
 */

const assert = require('assert');
const proxy = require('../lib/blockchain/server/economy-proxy');

const ENV_URL = 'RELDENS_ECONOMY_SERVICE_URL';
const ENV_SECRET = 'RELDENS_ECONOMY_INTERNAL_SECRET';

function setEnv(url, secret)
{
    if(url === null){
        delete process.env[ENV_URL];
    } else {
        process.env[ENV_URL] = url;
    }
    if(secret === null){
        delete process.env[ENV_SECRET];
    } else {
        process.env[ENV_SECRET] = secret;
    }
}

function jsonResponse(status, data)
{
    return {
        ok: status >= 200 && status < 300,
        status: status,
        json: async () => data
    };
}

function abortError()
{
    return new DOMException('The operation was aborted', 'AbortError');
}

try {
    let originalUrl = process.env[ENV_URL];
    let originalSecret = process.env[ENV_SECRET];

    // 1. Unset env: every function returns unavailable, never throws.
    setEnv(null, null);
    assert.strictEqual(proxy.economyServiceConfigured(), false);
    (async () => {
        let balance = await proxy.economyBalance(7);
        assert.strictEqual(balance.available, false);
        assert.strictEqual(balance.balance, null);
        let price = await proxy.economyPrice('stripe');
        assert.strictEqual(price.available, false);
        assert.strictEqual(price.price, null);
        let purchase = await proxy.economyPurchase({accountId: 1, rail: 'stripe', sku: 's1', idempotencyKey: 'k1'});
        assert.strictEqual(purchase.ok, false);
        assert.strictEqual(purchase.reason, 'unavailable');
        let spend = await proxy.economySpend({accountId: 1, itemId: 'i1', kind: 'item', expectedCost: 5, idempotencyKey: 'k2'});
        assert.strictEqual(spend.granted, false);
        assert.strictEqual(spend.reason, 'unavailable');
        let store = await proxy.economyStore(1);
        assert.strictEqual(store.available, false);
        assert.deepStrictEqual(store.items, []);
        let history = await proxy.economyHistory(1);
        assert.deepStrictEqual(history.entries, []);

        // 2. URL set but no secret: same unavailable contract.
        setEnv('https://economy.example.com', null);
        assert.strictEqual(proxy.economyServiceConfigured(), false);
        let noSecret = await proxy.economyBalance(7);
        assert.strictEqual(noSecret.available, false);

        // 3. Non-2xx answer: unavailable.
        setEnv('https://economy.example.com', 'secret');
        assert.strictEqual(proxy.economyServiceConfigured(), true);
        let nonOk = await proxy.economyBalance(7, async () => jsonResponse(500, {}));
        assert.strictEqual(nonOk.available, false);
        assert.strictEqual(nonOk.balance, null);

        // 4. Network error: unavailable, never throws.
        let netError = await proxy.economyPrice('sol', async () => {
            throw new Error('ECONNREFUSED');
        });
        assert.strictEqual(netError.available, false);

        // 5. Timeout via the AbortSignal: unavailable, never throws.
        let timeout = await proxy.economyPurchase(
            {accountId: 1, rail: 'stripe', sku: 's1', idempotencyKey: 'k1'},
            async () => {
                throw abortError();
            }
        );
        assert.strictEqual(timeout.ok, false);
        assert.strictEqual(timeout.reason, 'unavailable');

        // 6. Parsed result on 2xx, plus the secret/URL header wiring.
        let lastCall = null;
        let balance2 = await proxy.economyBalance(7, async (url, opts) => {
            lastCall = {url: String(url), headers: opts.headers, method: opts.method};
            return jsonResponse(200, {balance: 42});
        });
        assert.strictEqual(balance2.available, true);
        assert.strictEqual(balance2.balance, 42);
        assert.ok(lastCall.url.endsWith('/balance/7'));
        assert.strictEqual(lastCall.headers['x-reldens-economy-secret'], 'secret');

        // 7. Purchase happy path and spend happy path.
        let purchase2 = await proxy.economyPurchase(
            {accountId: 1, rail: 'stripe', sku: 's1', idempotencyKey: 'k1'},
            async () => jsonResponse(200, {ok: true, purchaseId: 'p1', rail: 'stripe'})
        );
        assert.strictEqual(purchase2.ok, true);
        assert.strictEqual(purchase2.purchaseId, 'p1');
        assert.strictEqual(purchase2.reason, null);
        let spend2 = await proxy.economySpend(
            {accountId: 1, itemId: 'i1', kind: 'item', expectedCost: 5, idempotencyKey: 'k2'},
            async () => jsonResponse(200, {granted: true, balance: 95, cost: 5})
        );
        assert.strictEqual(spend2.granted, true);
        assert.strictEqual(spend2.balance, 95);
        let store2 = await proxy.economyStore(1, async () => jsonResponse(
            200,
            [{itemId: 'a', name: 'Hat', cost: 10, owned: false}, {itemId: 'b', name: 'Bad', cost: 'x', owned: true}]
        ));
        assert.strictEqual(store2.available, true);
        assert.strictEqual(store2.items.length, 1);
        assert.strictEqual(store2.items[0].itemId, 'a');
        let history2 = await proxy.economyHistory(7, async () => jsonResponse(
            200,
            [
                {entryId: 'e1', accountId: 7, delta: 10, reason: 'buy', ref: 'r1', atMs: 1},
                {entryId: 'e2', accountId: 8, delta: 10, reason: 'buy', ref: 'r2', atMs: 2}
            ]
        ));
        assert.strictEqual(history2.entries.length, 1);
        assert.strictEqual(history2.entries[0].entryId, 'e1');

        // 8. Purchase refuses a rail the service did not echo back.
        let mismatched = await proxy.economyPurchase(
            {accountId: 1, rail: 'stripe', sku: 's1', idempotencyKey: 'k1'},
            async () => jsonResponse(200, {ok: true, purchaseId: 'p1', rail: 'usdc'})
        );
        assert.strictEqual(mismatched.ok, false);
        assert.strictEqual(mismatched.reason, 'unavailable');

        // Restore the original environment.
        setEnv(originalUrl, originalSecret);

        console.log('test-economy-proxy: all tests passed');
    })().catch((err) => {
        throw err;
    });
} catch (err) {
    throw err;
}
