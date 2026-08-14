/**
 *
 * Reldens - test-oauth-pkce
 *
 * Standalone tests for the pure OAuth2 PKCE / device-code helpers.
 *
 */

const assert = require('assert');
const { OauthPkce } = require('../lib/users/server/oauth-pkce');

const {
    pkceChallengeFromVerifier,
    safeEqual,
    verifyPkce,
    newUserCode,
    normalizeUserCode,
    redirectAllowed,
    USER_CODE_ALPHABET
} = OauthPkce;

// pkceChallengeFromVerifier is deterministic.
const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const challenge = pkceChallengeFromVerifier(verifier);
assert.strictEqual(challenge, pkceChallengeFromVerifier(verifier));
// 43 chars, base64url alphabet only.
assert.match(challenge, /^[A-Za-z0-9_-]{43}$/);

// verifyPkce S256: a valid verifier/challenge pair matches.
assert.strictEqual(verifyPkce(verifier, challenge, 'S256'), true);

// Plain method is rejected (no downgrade).
assert.strictEqual(verifyPkce(verifier, challenge, 'plain'), false);
assert.strictEqual(verifyPkce(verifier, verifier, 'plain'), false);

// Wrong verifier against a real challenge fails.
assert.strictEqual(verifyPkce(verifier + 'x', challenge, 'S256'), false);

// Empty inputs fail closed.
assert.strictEqual(verifyPkce('', challenge, 'S256'), false);
assert.strictEqual(verifyPkce(verifier, '', 'S256'), false);

// safeEqual is length-aware and constant-time by construction.
assert.strictEqual(safeEqual('abc', 'abc'), true);
assert.strictEqual(safeEqual('abc', 'abd'), false);
assert.strictEqual(safeEqual('abc', 'abcd'), false);

// newUserCode: XXXX-XXXX shape, alphabet only (no 0/O/1/I, no dashes inside chars).
for(let i = 0; i < 100; i++){
    const code = newUserCode();
    assert.match(code, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/, code);
    for(const ch of code.replace(/-/g, '')){
        assert.ok(USER_CODE_ALPHABET.includes(ch), `unexpected char ${ch} in ${code}`);
    }
}

// normalizeUserCode strips dashes/separators and uppercases.
assert.strictEqual(normalizeUserCode('abcd-EFGH'), 'ABCDEFGH');
assert.strictEqual(normalizeUserCode(' ab-cd ef '), 'ABCDEF');
assert.strictEqual(normalizeUserCode('a1b2-c3d4'), 'A1B2C3D4');

// redirectAllowed: exact match only.
const uris = 'https://app.example.com/callback\n\nhttps://cli.example.com/  \n';
assert.strictEqual(redirectAllowed(uris, 'https://app.example.com/callback'), true);
assert.strictEqual(redirectAllowed(uris, 'https://cli.example.com/'), true);
// Prefix / suffix / embedded variants must NOT match.
assert.strictEqual(redirectAllowed(uris, 'https://app.example.com/callback/evil'), false);
assert.strictEqual(redirectAllowed(uris, 'https://app.example.com'), false);
assert.strictEqual(redirectAllowed(uris, 'https://evil.example.com/callback'), false);
assert.strictEqual(redirectAllowed(uris, 'app.example.com/callback'), false);

console.log('test-oauth-pkce: all tests passed');
