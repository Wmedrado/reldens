/**
 *
 * Reldens - Blockchain Rate Limit
 *
 * Simple in-memory rate limiter (per client IP / account, sliding minute
 * window). Every limiter reports the frozen outcome {allowed, remaining,
 * resetSeconds}: allowed means the attempt is under the limit and served,
 * remaining is the attempts left in the window after this one, and
 * resetSeconds is the whole seconds until the window clears (for a
 * Retry-After header).
 *
 * Client IP resolution must work behind a reverse proxy: connections arrive
 * from the proxy (a private/loopback address), so its X-Forwarded-For is
 * trusted for those sources only. Direct internet clients have public
 * addresses and are never trusted, so they cannot spoof the header. Set
 * RELDENS_TRUSTED_PROXY_IPS (comma-separated) to pin an explicit proxy list
 * instead of the private-range default.
 *
 */

const net = require('node:net');
const { BlockchainConst } = require('../constants');

const WINDOW_MS = 60000;
const MAX_TRACKED_IPS = 10000;
const BACKSTOP_EVICT_BATCH = 512;

// Injectable wall clock. Defaults to Date.now so every caller is unaffected;
// tests can pin a deterministic clock via setRateLimitClock and must restore
// the default with resetRateLimitClock.
let clockNow = Date.now;

/**
 * Pin the rate-limiter clock to a deterministic source (test-only).
 *
 * @param {Function} now
 */
function setRateLimitClock(now)
{
    if('production' === process.env.NODE_ENV){
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
 * The rate-limiter's current wall-clock reading.
 *
 * @returns {number}
 */
function rateLimitNow()
{
    return clockNow();
}

// Pure outcome math shared by every window limiter: `count` attempts recorded
// against `limit` in a window that clears at `windowRefMs + windowMs`
// (`windowRefMs` is the oldest in-window attempt for a sliding window).
function windowedRateLimitOutcome(count, limit, windowRefMs, windowMs, now)
{
    return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetSeconds: Math.max(0, Math.ceil((windowRefMs + windowMs - now) / 1000))
    };
}

// Build the outcome for a record-then-judge sliding-window limiter from the
// updated timestamp list (already pruned to the window and with `now` pushed).
// The list always holds at least `now`, so updated[0] is the oldest in-window
// timestamp and the window clears once it ages out.
function slidingWindowOutcome(updated, maxPerMinute, now)
{
    return windowedRateLimitOutcome(updated.length, maxPerMinute, updated[0], WINDOW_MS, now);
}

/**
 * Merge two fused-bucket (IP AND account) outcomes into one: a fused request is
 * allowed only if BOTH buckets allow, remaining is the tighter (min) of the
 * two, and resetSeconds the longer (max) wait so a retry clears whichever
 * bucket is more backed up.
 *
 * @param {Object} ip
 * @param {Object} account
 * @returns {Object}
 */
function mergeFusedOutcomes(ip, account)
{
    return {
        allowed: ip.allowed && account.allowed,
        remaining: Math.min(ip.remaining, account.remaining),
        resetSeconds: Math.max(ip.resetSeconds, account.resetSeconds)
    };
}

// The strictest (lowest) limit any caller passes to rateLimited(). The shared
// `attempts` map must judge "is this IP currently limited" by the strictest
// policy, or a flood on a lenient route could evict an IP that is already
// limited under a stricter route and reset it mid-window.
const STRICTEST_RATE_LIMIT = 10;

const attempts = new Map();

function backstopTargetSize()
{
    return Math.max(0, MAX_TRACKED_IPS - BACKSTOP_EVICT_BATCH);
}

/**
 * Canonicalize an IP: lowercase, drop the IPv4-mapped prefix, and compress
 * IPv6 via the WHATWG serializer (gated on net.isIP so only a valid literal
 * reaches new URL). Anything net.isIP rejects passes through unchanged.
 *
 * @param {string} ip
 * @returns {string}
 */
function normalizeIp(ip)
{
    let normalized = ip.toLowerCase();
    if(normalized.startsWith('::ffff:')){
        normalized = normalized.slice('::ffff:'.length);
    }
    if(6 === net.isIP(normalized)){
        try {
            return new URL('http://['+normalized+']').hostname.slice(1, -1);
        } catch (error) {
            return normalized;
        }
    }
    return normalized;
}

// loopback, RFC1918, link-local, IPv6 ULA: the only sources a reverse proxy
// (or a dev setup) can connect from.
function isPrivateOrLoopback(ip)
{
    if('::1' === ip || ip.startsWith('127.')){
        return true;
    }
    if(ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')){
        return true;
    }
    let oct172 = /^172\.(\d{1,3})\./.exec(ip);
    if(oct172){
        let octet = Number(oct172[1]);
        return 16 <= octet && octet <= 31;
    }
    let lower = ip.toLowerCase();
    return lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:');
}

function isTrustedProxy(ip)
{
    let configured = process.env.RELDENS_TRUSTED_PROXY_IPS || process.env.TRUSTED_PROXY_IPS;
    if(configured){
        return configured
            .split(',')
            .map((currentIp) => normalizeIp(currentIp.trim()))
            .filter(Boolean)
            .includes(ip);
    }
    return isPrivateOrLoopback(ip);
}

/**
 * Resolve the real client IP for a request, honoring X-Forwarded-For only from
 * trusted proxies.
 *
 * @param {Object} req
 * @returns {string}
 */
function requestIp(req)
{
    let remote = normalizeIp(String(req.socket?.remoteAddress ?? 'unknown').trim());
    if(!isTrustedProxy(remote)){
        return remote;
    }
    // Walk X-Forwarded-For from the right (the end our own proxies append to),
    // past any trusted hops; the first address we don't control is the real
    // client. Everything left of it is client-supplied and spoofable.
    let chain = String(req.headers['x-forwarded-for'] ?? '')
        .split(',')
        .map((currentIp) => normalizeIp(currentIp.trim()))
        .filter(Boolean);
    for(let i = chain.length - 1; i >= 0; i--){
        if(!isTrustedProxy(chain[i])){
            return chain[i];
        }
    }
    return chain[0] ?? remote;
}

// Single source of truth for "are there at least `limit` timestamps still
// inside the window". Both the limiter's active-check and its memory-backstop
// eviction skip-check route through this.
function atOrOverLimit(times, windowStart, limit)
{
    return times.filter((currentTime) => currentTime > windowStart).length >= limit;
}

function recordSlidingWindowAttempt(attemptsByKey, key, maxPerMinute)
{
    let now = clockNow();
    let windowStart = now - WINDOW_MS;
    let list = (attemptsByKey.get(key) ?? []).filter((currentTime) => currentTime > windowStart);
    let updated = [...list, now];
    attemptsByKey.set(key, updated);

    // Memory backstop: bound the map without clearing it (a blanket clear()
    // would also wipe the counter just recorded, silently disabling rate
    // limiting under load).
    if(attemptsByKey.size > MAX_TRACKED_IPS){
        // Stage 1: evict keys whose window has fully expired (cheap, harmless).
        for(let [currentKey, times] of attemptsByKey){
            if(currentKey === key){
                continue;
            }
            if(0 === times.length || times[times.length - 1] <= windowStart){
                attemptsByKey.delete(currentKey);
            }
            if(attemptsByKey.size <= MAX_TRACKED_IPS){
                break;
            }
        }
        // Stage 2: a pure flood is all in-window, so fall back to evicting the
        // least-recently-active key, skipping the current one and any
        // currently-limited key. If everything left is current or limited,
        // accept a soft over-cap rather than reset a live limit.
        let targetSize = backstopTargetSize();
        while(attemptsByKey.size > targetSize){
            let oldest = null;
            for(let [currentKey, times] of attemptsByKey){
                if(currentKey === key){
                    continue;
                }
                if(atOrOverLimit(times, windowStart, maxPerMinute + 1)){
                    continue;
                }
                let last = 0 === times.length ? 0 : times[times.length - 1];
                if(!oldest || last < oldest.seen){
                    oldest = {key: currentKey, seen: last};
                }
            }
            if(!oldest){
                break;
            }
            attemptsByKey.delete(oldest.key);
        }
    }
    return slidingWindowOutcome(updated, maxPerMinute, now);
}

/**
 * Generic per-IP sliding-window limiter.
 *
 * @param {Object} req
 * @param {number} maxPerMinute
 * @returns {Object}
 */
function rateLimited(req, maxPerMinute = 20)
{
    let ip = requestIp(req);
    let now = clockNow();
    let windowStart = now - WINDOW_MS;
    let list = (attempts.get(ip) ?? []).filter((currentTime) => currentTime > windowStart);
    let updated = [...list, now];
    attempts.set(ip, updated);

    if(attempts.size > MAX_TRACKED_IPS){
        // Judge "currently limited" by the STRICTEST policy sharing this map
        // (not this call's maxPerMinute): a flood on a lenient route must not
        // evict an IP that a stricter route has already limited.
        let isLimited = (times) => atOrOverLimit(times, windowStart, STRICTEST_RATE_LIMIT + 1);
        for(let [key, times] of attempts){
            if(key === ip){
                continue;
            }
            if(0 === times.length || times[times.length - 1] <= windowStart){
                attempts.delete(key);
            }
            if(attempts.size <= MAX_TRACKED_IPS){
                break;
            }
        }
        let targetSize = backstopTargetSize();
        while(attempts.size > targetSize){
            let oldestKey;
            let oldestSeen = Infinity;
            for(let [key, times] of attempts){
                if(key === ip){
                    continue;
                }
                if(isLimited(times)){
                    continue;
                }
                let last = 0 === times.length ? 0 : times[times.length - 1];
                if(last < oldestSeen){
                    oldestSeen = last;
                    oldestKey = key;
                }
            }
            if(undefined === oldestKey){
                break;
            }
            attempts.delete(oldestKey);
        }
    }
    return slidingWindowOutcome(updated, maxPerMinute, now);
}

const walletLinkIpAttempts = new Map();
const walletLinkAccountAttempts = new Map();

/**
 * Fused per-IP AND per-account wallet-link throttle. Kept on its own buckets so
 * a link flood can never burn a player's login budget.
 *
 * @param {Object} req
 * @param {number} accountId
 * @returns {Object}
 */
function walletLinkRateLimited(req, accountId)
{
    let ip = recordSlidingWindowAttempt(
        walletLinkIpAttempts,
        requestIp(req),
        BlockchainConst.WALLET_LINK_MAX_PER_MINUTE
    );
    let account = recordSlidingWindowAttempt(
        walletLinkAccountAttempts,
        accountId,
        BlockchainConst.WALLET_LINK_MAX_PER_MINUTE
    );
    return mergeFusedOutcomes(ip, account);
}

/**
 * Reset wallet-link throttles. Test-only.
 */
function resetWalletLinkRateLimits()
{
    walletLinkIpAttempts.clear();
    walletLinkAccountAttempts.clear();
}

const tokenBalanceIpAttempts = new Map();

/**
 * Throttle the public token-balance proxy per IP on its OWN bucket. The proxy
 * is unauthenticated (on-chain balances are public), so it keys on IP only.
 *
 * @param {Object} req
 * @returns {Object}
 */
function tokenBalanceRateLimited(req)
{
    return recordSlidingWindowAttempt(
        tokenBalanceIpAttempts,
        requestIp(req),
        BlockchainConst.TOKEN_BALANCE_MAX_PER_MINUTE
    );
}

/**
 * Reset the token-balance throttle. Test-only.
 */
function resetTokenBalanceRateLimits()
{
    tokenBalanceIpAttempts.clear();
}

/**
 * Reset the shared generic per-IP limiter. Test-only.
 */
function resetRateLimits()
{
    attempts.clear();
}

module.exports.WINDOW_MS = WINDOW_MS;
module.exports.MAX_TRACKED_IPS = MAX_TRACKED_IPS;
module.exports.BACKSTOP_EVICT_BATCH = BACKSTOP_EVICT_BATCH;
module.exports.setRateLimitClock = setRateLimitClock;
module.exports.resetRateLimitClock = resetRateLimitClock;
module.exports.rateLimitNow = rateLimitNow;
module.exports.windowedRateLimitOutcome = windowedRateLimitOutcome;
module.exports.mergeFusedOutcomes = mergeFusedOutcomes;
module.exports.normalizeIp = normalizeIp;
module.exports.isPrivateOrLoopback = isPrivateOrLoopback;
module.exports.isTrustedProxy = isTrustedProxy;
module.exports.requestIp = requestIp;
module.exports.recordSlidingWindowAttempt = recordSlidingWindowAttempt;
module.exports.rateLimited = rateLimited;
module.exports.walletLinkRateLimited = walletLinkRateLimited;
module.exports.resetWalletLinkRateLimits = resetWalletLinkRateLimits;
module.exports.tokenBalanceRateLimited = tokenBalanceRateLimited;
module.exports.resetTokenBalanceRateLimits = resetTokenBalanceRateLimits;
module.exports.resetRateLimits = resetRateLimits;
