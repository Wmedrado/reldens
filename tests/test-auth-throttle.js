/**
 *
 * Reldens - test-auth-throttle
 *
 * Standalone tests for the per-account failed-login throttle. Uses the pinned-clock seam
 * so window math is deterministic, and always restores the default clock afterwards.
 *
 */

const assert = require('assert');
const { AuthThrottle } = require('../lib/users/server/auth-throttle');

let now = 1_000_000_000_000;

function setup()
{
    AuthThrottle.resetRateLimitClock();
    AuthThrottle.resetAuthFailures();
    now = 1_000_000_000_000;
    AuthThrottle.setRateLimitClock(() => now);
}

function teardown()
{
    AuthThrottle.resetAuthFailures();
    AuthThrottle.resetRateLimitClock();
}

try {
    // Throttle basics: 10 failures lock the account out.
    setup();
    for(let i = 0; i < AuthThrottle.MAX_AUTH_FAILURES; i++){
        AuthThrottle.recordAuthFailure('Alice');
    }
    let outcome = AuthThrottle.authThrottled('Alice');
    assert.strictEqual(outcome.allowed, false);
    assert.strictEqual(outcome.remaining, 0);
    assert.ok(outcome.resetSeconds > 0, `expected resetSeconds > 0, got ${outcome.resetSeconds}`);

    // Key normalization: ' Alice ' and 'ALICE' share one bucket.
    outcome = AuthThrottle.authThrottled(' ALICE ');
    assert.strictEqual(outcome.allowed, false);
    assert.strictEqual(outcome.remaining, 0);
    assert.strictEqual(AuthThrottle.authFailureCount(), 1);

    // Clear after successful login: allowed again with full allowance.
    AuthThrottle.clearAuthFailures('alice');
    outcome = AuthThrottle.authThrottled('Alice');
    assert.strictEqual(outcome.allowed, true);
    assert.strictEqual(outcome.remaining, AuthThrottle.MAX_AUTH_FAILURES);

    // Below the ceiling: remaining counts down, resetSeconds reflects the oldest failure.
    setup();
    AuthThrottle.recordAuthFailure('Bob');
    now += 1000;
    AuthThrottle.recordAuthFailure('Bob');
    outcome = AuthThrottle.authThrottled('Bob');
    assert.strictEqual(outcome.allowed, true);
    assert.strictEqual(outcome.remaining, AuthThrottle.MAX_AUTH_FAILURES - 2);
    assert.ok(outcome.resetSeconds <= AuthThrottle.AUTH_FAIL_WINDOW_MS / 1000);

    // Window pruning: once the oldest failure ages out, the account is clean again.
    now += AuthThrottle.AUTH_FAIL_WINDOW_MS + 1000;
    outcome = AuthThrottle.authThrottled('Bob');
    assert.strictEqual(outcome.allowed, true);
    assert.strictEqual(outcome.remaining, AuthThrottle.MAX_AUTH_FAILURES);
    assert.strictEqual(outcome.resetSeconds, 0);
    assert.strictEqual(AuthThrottle.authFailureCount(), 0);

    // Distinct accounts get distinct buckets.
    setup();
    AuthThrottle.recordAuthFailure('Carol');
    AuthThrottle.recordAuthFailure('Dave');
    assert.strictEqual(AuthThrottle.authFailureCount(), 2);
    AuthThrottle.clearAuthFailures('Carol');
    assert.strictEqual(AuthThrottle.authFailureCount(), 1);

    teardown();

    // Clock seam guards: resetRestores the default, and pinning throws in production.
    AuthThrottle.resetRateLimitClock();
    assert.ok(Math.abs(AuthThrottle.rateLimitNow() - Date.now()) < 1000);
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    assert.throws(() => AuthThrottle.setRateLimitClock(() => 0),
        /setRateLimitClock is test-only/);
    process.env.NODE_ENV = prevEnv;

    console.log('test-auth-throttle: all tests passed');
} catch (err) {
    teardown();
    throw err;
}
