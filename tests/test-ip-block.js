/**
 *
 * Reldens - test-ip-block
 *
 * Standalone tests for the pure IP blocklist cache and helpers.
 *
 */

const assert = require('assert');
const { IpBlock } = require('../lib/users/server/ip-block');

const { cleanIp, parseBlockExpiry, IpBlockList, isConnectionRefused } = IpBlock;

// cleanIp: valid IPv4 and IPv6 pass through.
assert.strictEqual(cleanIp('192.168.1.1'), '192.168.1.1');
assert.strictEqual(cleanIp('2001:db8::1'), '2001:db8::1');
// cleanIp: IPv4-mapped IPv6 is canonicalized to plain IPv4.
assert.strictEqual(cleanIp('::ffff:192.168.1.1'), '192.168.1.1');
assert.strictEqual(cleanIp('::FFFF:10.0.0.1'), '10.0.0.1');
// cleanIp: garbage and partials are rejected.
assert.strictEqual(cleanIp('not-an-ip'), '');
assert.strictEqual(cleanIp('192.168.1'), '');
assert.strictEqual(cleanIp('192.168.1.999'), '');
assert.strictEqual(cleanIp(12345), '');
assert.strictEqual(cleanIp(null), '');
assert.strictEqual(cleanIp(''), '');

// parseBlockExpiry: missing/empty means permanent.
assert.strictEqual(parseBlockExpiry(undefined), null);
assert.strictEqual(parseBlockExpiry(null), null);
assert.strictEqual(parseBlockExpiry(''), null);

// parseBlockExpiry: a past date throws.
assert.throws(() => parseBlockExpiry(Date.now() - 1000), /block expiry must be in the future/);
assert.throws(() => parseBlockExpiry('not a date'), /block expiry must be in the future/);

// parseBlockExpiry: a future date is returned.
const future = new Date(Date.now() + 60 * 60 * 1000);
const parsed = parseBlockExpiry(future.toISOString());
assert.ok(parsed instanceof Date);
assert.strictEqual(parsed.getTime(), future.getTime());

// IpBlockList: permanent (null expiry) blocks forever.
const list = new IpBlockList();
list.setEntries([
    {ip: '1.2.3.4', expiresAtMs: null},
    {ip: '5.6.7.8', expiresAtMs: Date.now() + 60 * 60 * 1000}
]);
assert.strictEqual(list.size, 2);
assert.strictEqual(list.isBlocked('1.2.3.4', Date.now() + 10 ** 15), true);
assert.strictEqual(list.isBlocked('5.6.7.8', Date.now() + 1000), true);

// Expired entry stops blocking after its expiry.
assert.strictEqual(list.isBlocked('5.6.7.8', Date.now() + 60 * 60 * 1000 + 1000), false);

// Unknown IP is not blocked.
assert.strictEqual(list.isBlocked('9.9.9.9', Date.now()), false);

// setEntries replaces the previous state.
list.setEntries([{ip: '10.0.0.1', expiresAtMs: null}]);
assert.strictEqual(list.size, 1);
assert.strictEqual(list.isBlocked('1.2.3.4', Date.now()), false);
assert.strictEqual(list.isBlocked('10.0.0.1', Date.now()), true);

// isConnectionRefused: admin bypasses everything.
assert.strictEqual(isConnectionRefused({blocked: true, isAdmin: true, ipSessions: 99, hardLimit: 2}), false);
assert.strictEqual(isConnectionRefused({blocked: true, isAdmin: true, ipSessions: 1, hardLimit: 2}), false);

// isConnectionRefused: blocked IP refuses a non-admin.
assert.strictEqual(isConnectionRefused({blocked: true, isAdmin: false, ipSessions: 1, hardLimit: 2}), true);

// isConnectionRefused: session cap refuses a non-admin.
assert.strictEqual(isConnectionRefused({blocked: false, isAdmin: false, ipSessions: 2, hardLimit: 2}), true);
assert.strictEqual(isConnectionRefused({blocked: false, isAdmin: false, ipSessions: 3, hardLimit: 2}), true);

// isConnectionRefused: clear of both allows.
assert.strictEqual(isConnectionRefused({blocked: false, isAdmin: false, ipSessions: 1, hardLimit: 2}), false);

console.log('test-ip-block: all tests passed');
