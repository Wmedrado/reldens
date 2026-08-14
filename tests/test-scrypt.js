/**
 *
 * Reldens - test-scrypt
 *
 * Standalone tests for the scrypt password hashing module.
 *
 */

const assert = require('assert');
const { ScryptPassword } = require('../lib/users/server/scrypt');

(async () => {
    const hash = await ScryptPassword.hashPassword('correct horse battery staple');
    assert.match(hash, /^[0-9a-f]{32}:[0-9a-f]{128}$/, hash);

    // Roundtrip: correct password verifies.
    assert.strictEqual(await ScryptPassword.verifyPassword('correct horse battery staple', hash), true);

    // Wrong password fails.
    assert.strictEqual(await ScryptPassword.verifyPassword('wrong password', hash), false);

    // Malformed stored values fail closed (never throw).
    assert.strictEqual(await ScryptPassword.verifyPassword('x', 'garbage'), false);
    assert.strictEqual(await ScryptPassword.verifyPassword('x', 'aa:bb'), false);
    assert.strictEqual(await ScryptPassword.verifyPassword('x', ':'), false);
    assert.strictEqual(await ScryptPassword.verifyPassword('x', ''), false);

    // Salts are random: same password hashes differently.
    const hash2 = await ScryptPassword.hashPassword('correct horse battery staple');
    assert.notStrictEqual(hash, hash2);

    // Tokens: 64 hex chars, random.
    const token1 = ScryptPassword.newToken();
    const token2 = ScryptPassword.newToken();
    assert.match(token1, /^[0-9a-f]{64}$/);
    assert.notStrictEqual(token1, token2);

    console.log('test-scrypt: all tests passed');
})();
