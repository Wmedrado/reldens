/**
 *
 * Reldens - OauthPkce
 *
 * Pure OAuth2 PKCE / device-code helpers, ported from the companion-source
 * implementation. Only the pure functions: no HTTP routes, no DB. Enough for a
 * client to mint a challenge, the server to verify a verifier (S256 only), and
 * both sides to normalize RFC 8628 user codes.
 *
 */

const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');

/**
 * @param {Buffer} buf
 * @returns {string}
 */
function base64url(buf)
{
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// S256 PKCE transform: BASE64URL(SHA256(verifier)).
/**
 * @param {string} verifier
 * @returns {string}
 */
function pkceChallengeFromVerifier(verifier)
{
    return base64url(createHash('sha256').update(verifier).digest());
}

// Constant-time string compare for the challenge match.
/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function safeEqual(a, b)
{
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if(ab.length !== bb.length){
        return false;
    }
    return timingSafeEqual(ab, bb);
}

// Verify a PKCE code_verifier against the stored challenge. Only 'S256' is
// accepted; 'plain' is rejected so a client cannot downgrade away from the
// protection against an intercepted authorization code. Returns false for
// anything else.
/**
 * @param {string} verifier
 * @param {string} challenge
 * @param {string} method
 * @returns {boolean}
 */
function verifyPkce(verifier, challenge, method)
{
    if(!verifier || !challenge){
        return false;
    }
    if(method === 'S256'){
        return safeEqual(pkceChallengeFromVerifier(verifier), challenge);
    }
    return false;
}

// RFC 8628 user_code: 8 chars from an unambiguous alphabet (no 0/O/1/I), shown
// as XXXX-XXXX. Generated without Math.random.
/** @type {string} */
const USER_CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ23456789';

/**
 * @returns {string}
 */
function newUserCode()
{
    const bytes = randomBytes(8);
    let out = '';
    for(let i = 0; i < 8; i++){
        out += USER_CODE_ALPHABET[bytes[i] % USER_CODE_ALPHABET.length];
        if(i === 3){
            out += '-';
        }
    }
    return out;
}

/**
 * @param {string} raw
 * @returns {string}
 */
function normalizeUserCode(raw)
{
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Exact-match redirect allowlist (newline-separated).
/**
 * @param {string} redirectUris
 * @param {string} redirectUri
 * @returns {boolean}
 */
function redirectAllowed(redirectUris, redirectUri)
{
    return redirectUris
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .includes(redirectUri);
}

module.exports.OauthPkce = {
    base64url,
    pkceChallengeFromVerifier,
    safeEqual,
    verifyPkce,
    USER_CODE_ALPHABET,
    newUserCode,
    normalizeUserCode,
    redirectAllowed
};
