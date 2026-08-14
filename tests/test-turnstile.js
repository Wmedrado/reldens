/**
 *
 * Reldens - test-turnstile
 *
 * Standalone tests for the Cloudflare Turnstile verification gate.
 *
 */

const assert = require('assert');
const { Turnstile } = require('../lib/users/server/turnstile');

const { verifyTurnstile, passesTurnstile } = Turnstile;

function mockFetch(result)
{
    return async () => {
        if(result instanceof Error){
            throw result;
        }
        return result;
    };
}

async function main()
{
    // No secret configured (dev/test) lets every request through.
    delete process.env.RELDENS_TURNSTILE_SECRET;
    assert.strictEqual(await passesTurnstile({token: 'whatever'}), true);

    // No secret also passes when the flag is on but the env is unset.
    process.env.RELDENS_TURNSTILE_SECRET = '';
    assert.strictEqual(await passesTurnstile({token: 'x'}), true);

    // With a secret set, an empty token fails closed.
    process.env.RELDENS_TURNSTILE_SECRET = 'secret';
    assert.strictEqual(await verifyTurnstile('', 'secret'), false);
    assert.strictEqual(await verifyTurnstile('token', ''), false);

    // Mocked siteverify returning success -> verified.
    let ok = await verifyTurnstile('token', 'secret', '1.2.3.4', mockFetch({ok: true, json: async () => ({success: true})}));
    assert.strictEqual(ok, true);

    // Non-2xx response -> false.
    ok = await verifyTurnstile('token', 'secret', undefined, mockFetch({ok: false, status: 500, json: async () => ({success: true})}));
    assert.strictEqual(ok, false);

    // Malformed JSON -> false.
    ok = await verifyTurnstile('token', 'secret', undefined, mockFetch({ok: true, json: async () => { throw new Error('bad json'); }}));
    assert.strictEqual(ok, false);

    // success not exactly true -> false.
    ok = await verifyTurnstile('token', 'secret', undefined, mockFetch({ok: true, json: async () => ({success: 'yes'})}));
    assert.strictEqual(ok, false);

    // Network failure -> false.
    ok = await verifyTurnstile('token', 'secret', undefined, mockFetch(new Error('network down')));
    assert.strictEqual(ok, false);

    // passesTurnstile routes the env secret + token through verification.
    ok = await passesTurnstile({token: 'token', fetchImpl: mockFetch({ok: true, json: async () => ({success: true})})});
    assert.strictEqual(ok, true);

    console.log('test-turnstile: all tests passed');
}

main().catch((error) => {
    delete process.env.RELDENS_TURNSTILE_SECRET;
    throw error;
});
