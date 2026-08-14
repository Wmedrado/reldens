/**
 *
 * Reldens - AuthThrottle
 *
 * Per-account failed-login throttle. A per-IP limiter can't stop credential stuffing: a
 * botnet spreads guesses for one account across thousands of IPs, each well under the IP
 * cap. This tracks FAILED login attempts keyed by username, so brute-forcing a single
 * account is throttled regardless of source IP. Successful logins clear the counter, so a
 * legitimate user who finally types the right password isn't punished for earlier typos.
 *
 * In-memory only, deliberately: each game server process throttles the accounts it
 * authenticates, and a restart clears the counters (a hard lockout would need storage).
 *
 */

const AUTH_FAIL_WINDOW_MS = 15 * 60000; // 15 minutes
const MAX_AUTH_FAILURES = 10; // per account per window
const authFailures = new Map(); // Map<string, number[]> - key => failure timestamps

// Memory backstop so a credential-stuffing flood cannot grow the map unbounded.
const MAX_TRACKED_ACCOUNTS = 10000;
const BACKSTOP_EVICT_BATCH = 512;

// Injectable wall clock. Defaults to Date.now so every existing caller and test is
// unaffected; tests can pin a deterministic clock via setRateLimitClock and must restore
// the default with resetRateLimitClock.
let clockNow = Date.now;

/**
 * Pin the throttle clock to a deterministic source (test-only).
 * @param {function(): number} now
 */
function setRateLimitClock(now)
{
    // Hard guard: a pinned clock must never be installable in production, where a frozen
    // or backward clock could hold a throttle window open indefinitely and defeat rate
    // limiting. The default Date.now path is unaffected; tests run outside
    // NODE_ENV=production.
    if(process.env.NODE_ENV === 'production'){
        throw new Error('setRateLimitClock is test-only and must not be called in production');
    }
    clockNow = now;
}

/**
 * Restore the default Date.now clock (test-only).
 */
function resetRateLimitClock()
{
    clockNow = Date.now;
}

/**
 * The throttle's current wall-clock reading (the same seam authThrottled/recordAuthFailure
 * read, exposed so callers and tests see one clock).
 * @returns {number}
 */
function rateLimitNow()
{
    return clockNow();
}

/**
 * Normalize so 'Alice', 'alice', and ' alice ' share one bucket and can't be used to
 * multiply the allowance against the same account.
 * @param {string} username
 * @returns {string}
 */
function authKey(username)
{
    return username.trim().toLowerCase();
}

/**
 * Single source of truth for 'are there at least `limit` timestamps still inside the
 * window'. Both the active-check and the memory-backstop eviction skip-check route through
 * this, so the 'is this key currently limited' question can never drift between the two.
 * @param {number[]} times
 * @param {number} windowStart
 * @param {number} limit
 * @returns {boolean}
 */
function atOrOverLimit(times, windowStart, limit)
{
    return times.filter((t) => t > windowStart).length >= limit;
}

/**
 * An account is throttled once its in-window failures reach MAX_AUTH_FAILURES.
 * @param {number[]} times
 * @param {number} windowStart
 * @returns {boolean}
 */
function isThrottled(times, windowStart)
{
    return atOrOverLimit(times, windowStart, MAX_AUTH_FAILURES);
}

/**
 * The failed-login outcome for an account. READ-ONLY on limiter state: it prunes stale
 * failures but records NONE (only recordAuthFailure does). allowed is false once the
 * account has hit the failed-attempt ceiling within the window; remaining counts the
 * attempts left before the lockout, and resetSeconds is the wait until the oldest failure
 * ages out (0 when there are no failures in the window).
 * @param {string} username
 * @returns {{allowed: boolean, remaining: number, resetSeconds: number}}
 */
function authThrottled(username)
{
    const key = authKey(username);
    const now = clockNow();
    const windowStart = now - AUTH_FAIL_WINDOW_MS;
    const recent = (authFailures.get(key) ?? []).filter((t) => t > windowStart);
    if(recent.length > 0){
        authFailures.set(key, recent);
    } else {
        authFailures.delete(key);
    }
    const count = recent.length;
    return {
        allowed: count < MAX_AUTH_FAILURES,
        remaining: Math.max(0, MAX_AUTH_FAILURES - count),
        resetSeconds: count > 0
            ? Math.max(0, Math.ceil((recent[0] + AUTH_FAIL_WINDOW_MS - now) / 1000))
            : 0
    };
}

/**
 * Record a failed login for an account (call on bad password / unknown user).
 * @param {string} username
 */
function recordAuthFailure(username)
{
    const key = authKey(username);
    const windowStart = clockNow() - AUTH_FAIL_WINDOW_MS;
    const recent = (authFailures.get(key) ?? []).filter((t) => t > windowStart);
    recent.push(clockNow());
    authFailures.set(key, recent);
    if(authFailures.size <= MAX_TRACKED_ACCOUNTS){
        return;
    }

    // Memory backstop. A blanket clear() would also wipe the live lockout counters we are
    // accumulating against accounts under attack, which is exactly when a credential-
    // stuffing flood inflates this map past the cap, silently disabling the per-account
    // throttle.
    //
    // Stage 1: evict accounts whose window has fully expired (cheap, harmless).
    for(const [k, times] of authFailures){
        if(k === key){
            continue;
        }
        if(times.length === 0 || times[times.length - 1] <= windowStart){
            authFailures.delete(k);
        }
        if(authFailures.size <= MAX_TRACKED_ACCOUNTS){
            break;
        }
    }

    // Stage 2: a pure flood is all in-window, so stage 1 evicts nothing and the map would
    // grow unbounded. Fall back to evicting the least-recently-active account until back
    // under the cap.
    //
    // Critically, NEVER evict a currently-throttled account (isThrottled) or the account
    // just recorded: on the live login path a throttled account is rejected BEFORE
    // recordAuthFailure runs, so its timestamps go stale and it would otherwise look
    // 'oldest', letting an attacker reset a victim's throttle simply by flooding the map
    // with newer one-off failures. Only non-throttled idle entries (the flood's count-of-1
    // buckets) are sacrificed, the cost of a memory bound.
    const targetSize = Math.max(0, MAX_TRACKED_ACCOUNTS - BACKSTOP_EVICT_BATCH);
    while(authFailures.size > targetSize){
        let oldestKey;
        let oldestSeen = Infinity;
        for(const [k, times] of authFailures){
            if(k === key){
                continue;
            }
            if(isThrottled(times, windowStart)){
                continue;
            }
            const last = times.length === 0 ? 0 : times[times.length - 1];
            if(last < oldestSeen){
                oldestSeen = last;
                oldestKey = k;
            }
        }
        // Nothing evictable means every remaining account is either the current one or
        // currently throttled. Accept a SOFT cap and stop rather than reset any throttle:
        // we fail toward protection (the map grows) instead of toward bypass.
        if(oldestKey === undefined){
            break;
        }
        authFailures.delete(oldestKey);
    }
}

/**
 * Clear an account's failure history after a successful login.
 * @param {string} username
 */
function clearAuthFailures(username)
{
    authFailures.delete(authKey(username));
}

/**
 * Number of accounts currently tracked. Exposed for the backstop-bound test.
 * @returns {number}
 */
function authFailureCount()
{
    return authFailures.size;
}

/**
 * Reset all tracked failures. Test-only: keeps the shared map isolated per test.
 */
function resetAuthFailures()
{
    authFailures.clear();
}

module.exports.AuthThrottle = {
    AUTH_FAIL_WINDOW_MS,
    MAX_AUTH_FAILURES,
    setRateLimitClock,
    resetRateLimitClock,
    rateLimitNow,
    authThrottled,
    recordAuthFailure,
    clearAuthFailures,
    authFailureCount,
    resetAuthFailures
};
