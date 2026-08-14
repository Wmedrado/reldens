/**
 *
 * Reldens - Turnstile
 *
 * Cloudflare Turnstile server-side verification.
 *
 * The client renders a Turnstile widget on the login/register form; a human
 * (or a real browser) produces a one-time token that we verify here against
 * Cloudflare's siteverify endpoint. Headless clients cannot solve the
 * challenge, so they cannot obtain a valid token and are rejected before any
 * account work happens.
 *
 * Verification is gated by RELDENS_TURNSTILE_SECRET being set: with no secret
 * configured (local dev / tests) the gate passes everything, so development
 * stays frictionless.
 *
 * NOTE: the original implementation also carried native-app and desktop-shell
 * attestation arms. Neither applies to this browser-only 2D game yet, so they
 * are dropped here.
 *
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 5000;

// Fail-closed: an empty token, a non-2xx response, a malformed body, a timeout,
// or any network error all resolve to `false`.
/**
 * @param {string} token
 * @param {string} secret
 * @param {string} [remoteIp]
 * @param {Function} [fetchImpl]
 * @returns {Promise<boolean>}
 */
async function verifyTurnstile(token, secret, remoteIp, fetchImpl)
{
    if(!token || !secret){
        return false;
    }
    const doFetch = fetchImpl || fetch;
    try {
        const form = new URLSearchParams({secret, response: token});
        if(remoteIp){
            form.set('remoteip', remoteIp);
        }
        const res = await doFetch(SITEVERIFY_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: form,
            signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS)
        });
        if(!res.ok){
            return false;
        }
        const data = await res.json().catch(() => null);
        return data?.success === true;
    } catch (error) {
        return false;
    }
}

// The bot gate for account creation / login. Returns true when the request may
// proceed. With no secret configured (local dev / tests) verification is off
// entirely.
/**
 * @param {{token?: string, secret?: string, remoteIp?: string, fetchImpl?: Function}} [opts]
 * @returns {Promise<boolean>}
 */
async function passesTurnstile(opts)
{
    const secret = opts?.secret || process.env.RELDENS_TURNSTILE_SECRET || '';
    if(!secret){
        return true;
    }
    return await verifyTurnstile(opts?.token || '', secret, opts?.remoteIp, opts?.fetchImpl);
}

module.exports.Turnstile = {
    SITEVERIFY_URL,
    VERIFY_TIMEOUT_MS,
    verifyTurnstile,
    passesTurnstile
};
