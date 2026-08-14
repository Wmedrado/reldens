/**
 *
 * Reldens - test-blockchain-token-balance
 *
 * Standalone tests for the token balance parsing and the per-wallet cache.
 * The mint env var must be set before the module is loaded (it is read once at
 * load time); the RPC fetch is stubbed so no network call happens.
 *
 */

const assert = require('assert');

// The module reads these at load time, so they must be set before the require:
process.env.RELDENS_SOLANA_RPC_URL = 'http://127.0.0.1:9/rpc';
process.env.RELDENS_TOKEN_MINT = '3WjLscH2JsXLEFJZRA9z8ti8yRGxWGKbqymPd7UicRth';

const {
    decimalStringFromRawAmount,
    parseTokenBalance,
    parseDecimalAmount,
    parseRawAmount,
    cachedTokenBalance,
    fetchTokenBalance,
    resetTokenBalanceCacheForTests,
    TOKEN_MINT
} = require('../lib/blockchain/server/token-balance');

const TEST_PUBKEY = 'HCe5EmTL9sq9iAWTx1VfFmthz9gMG9HPs3yNn9MqXSUq';

// Stub the RPC: one token account with a fixed balance.
function stubRpc(uiAmount)
{
    let originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        result: {
            value: [{
                account: {
                    data: {
                        parsed: {
                            info: {
                                mint: TOKEN_MINT,
                                tokenAmount: {uiAmount: uiAmount, uiAmountString: String(uiAmount), amount: '1234567890', decimals: 6}
                            }
                        }
                    }
                }
            }]
        }
    }), {status: 200, headers: {'Content-Type': 'application/json'}});
    return originalFetch;
}

function restoreRpc(originalFetch)
{
    globalThis.fetch = originalFetch;
}

(async () => {
try {
    // decimalStringFromRawAmount: exact decimal math on strings.
    assert.strictEqual(decimalStringFromRawAmount('1234567890', 6), '1234.56789');
    assert.strictEqual(decimalStringFromRawAmount('1234567890', 0), '1234567890');
    assert.strictEqual(decimalStringFromRawAmount('0', 6), '0');
    assert.strictEqual(decimalStringFromRawAmount('1', 6), '0.000001');
    assert.strictEqual(decimalStringFromRawAmount('1000000', 6), '1');
    assert.strictEqual(decimalStringFromRawAmount('000123', 3), '0.123');
    assert.strictEqual(decimalStringFromRawAmount('123', -1), null);
    assert.strictEqual(decimalStringFromRawAmount('12a3', 6), null);
    assert.strictEqual(decimalStringFromRawAmount('123', 256), null);
    assert.strictEqual(decimalStringFromRawAmount('123', 1.5), null);

    // parseDecimalAmount: valid decimals only, non-negative.
    assert.strictEqual(parseDecimalAmount('1.5'), 1.5);
    assert.strictEqual(parseDecimalAmount('0'), 0);
    assert.strictEqual(parseDecimalAmount('-1'), null);
    assert.strictEqual(parseDecimalAmount('1.2.3'), null);
    assert.strictEqual(parseDecimalAmount('abc'), null);

    // parseRawAmount: string amount + numeric decimals only.
    assert.strictEqual(parseRawAmount('1234567890', 6), 1234.56789);
    assert.strictEqual(parseRawAmount(1234567890, 6), null);
    assert.strictEqual(parseRawAmount('123', '6'), null);

    // parseTokenBalance: uiAmount first, then uiAmountString, then raw+decimals.
    assert.strictEqual(parseTokenBalance({uiAmount: 1.25, amount: '999999', decimals: 6}), 1.25);
    assert.strictEqual(parseTokenBalance({uiAmountString: '2.5', amount: '999999', decimals: 6}), 2.5);
    assert.strictEqual(parseTokenBalance({amount: '1234567890', decimals: 6}), 1234.56789);
    assert.strictEqual(parseTokenBalance(null), null);
    assert.strictEqual(parseTokenBalance({}), null);
    assert.strictEqual(parseTokenBalance({uiAmount: -1, amount: 'abc', decimals: 6}), null);

    // fetchTokenBalance sums every token account and parses via the RPC stub.
    let originalFetch = stubRpc(2.25);
    let balance = await fetchTokenBalance(TEST_PUBKEY);
    assert.strictEqual(balance, 2.25);
    restoreRpc(originalFetch);

    // cachedTokenBalance: first read stores, second read hits the cache (no RPC).
    resetTokenBalanceCacheForTests();
    originalFetch = stubRpc(5.5);
    let firstRead = await cachedTokenBalance(TEST_PUBKEY);
    assert.strictEqual(firstRead, 5.5);
    let rpcCalls = 0;
    let countingFetch = globalThis.fetch;
    globalThis.fetch = async (...args) => {
        rpcCalls++;
        return countingFetch(...args);
    };
    let secondRead = await cachedTokenBalance(TEST_PUBKEY);
    assert.strictEqual(secondRead, 5.5);
    assert.strictEqual(rpcCalls, 0, 'expected a cache hit with no RPC call');
    restoreRpc(originalFetch);

    // A failed refresh keeps the last known value.
    resetTokenBalanceCacheForTests();
    originalFetch = stubRpc(7.5);
    await cachedTokenBalance(TEST_PUBKEY);
    globalThis.fetch = async () => new Response('{}', {status: 500});
    let failedRefresh = await cachedTokenBalance(TEST_PUBKEY, true);
    assert.strictEqual(failedRefresh, 7.5);
    restoreRpc(originalFetch);

    // An unread wallet with a failed RPC returns null.
    resetTokenBalanceCacheForTests();
    globalThis.fetch = async () => new Response('{}', {status: 500});
    assert.strictEqual(await cachedTokenBalance(TEST_PUBKEY, true), null);
    restoreRpc(originalFetch);

    // Cache reset for tests is idempotent.
    resetTokenBalanceCacheForTests();

    console.log('test-blockchain-token-balance: all tests passed');
} catch (err) {
    throw err;
}
})();
