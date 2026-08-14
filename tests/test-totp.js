/**
 *
 * Reldens - test-totp
 *
 * Standalone TOTP tests driven by the RFC 6238 (Appendix B) SHA-1 test vectors.
 *
 */

const assert = require('assert');
const { Totp } = require('../lib/users/server/totp');

// RFC 6238 Appendix B: the base32 encoding of the 20-byte seed '12345678901234567890'.
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

// RFC 6238 Appendix B SHA-1 vectors for 6-digit TOTP.
const RFC_VECTORS = [
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037']
];

for(const [timeSec, expectedCode] of RFC_VECTORS){
    const code = Totp.generateTotp(RFC_SECRET, timeSec * 1000);
    assert.strictEqual(code, expectedCode, `TOTP mismatch at time ${timeSec}`);
}

// verifyTotp accepts a valid code and returns the matched counter.
assert.strictEqual(Totp.verifyTotp(RFC_SECRET, '287082', 59 * 1000), 1);
assert.strictEqual(Totp.verifyTotp(RFC_SECRET, '287 082', 59 * 1000), 1);

// verifyTotp rejects a wrong code and non-numeric input.
assert.strictEqual(Totp.verifyTotp(RFC_SECRET, '000000', 59 * 1000), null);
assert.strictEqual(Totp.verifyTotp(RFC_SECRET, 'abc123', 59 * 1000), null);
assert.strictEqual(Totp.verifyTotp(RFC_SECRET, '12345', 59 * 1000), null);

// Window tolerance: code valid at counter 1 is accepted while center is within one step
// (time 0-89s), rejected once center steps past it.
assert.strictEqual(Totp.verifyTotp(RFC_SECRET, '287082', 0), 1);
assert.strictEqual(Totp.verifyTotp(RFC_SECRET, '287082', 89 * 1000), 1);
assert.strictEqual(Totp.verifyTotp(RFC_SECRET, '287082', 90 * 1000), null);
assert.strictEqual(Totp.verifyTotp(RFC_SECRET, '287082', -1000), null);

// Invalid base32 secret fails closed.
assert.strictEqual(Totp.verifyTotp('!!!!', '287082', 59 * 1000), null);

// Base32 roundtrip on a fresh secret.
const secret = Totp.generateSecret();
assert.strictEqual(Totp.base32Encode(Totp.base32Decode(secret)), secret);
// Decode tolerates case, spaces, and padding.
assert.deepStrictEqual(Totp.base32Decode(secret.toLowerCase()), Totp.base32Decode(secret));
assert.deepStrictEqual(Totp.base32Decode(` ${secret} `), Totp.base32Decode(secret));
assert.throws(() => Totp.base32Decode('not base32!'), /invalid base32 character/);

// otpauth URI shape.
const uri = Totp.otpauthUri(RFC_SECRET, 'player@example.com', 'Reldens');
assert.ok(uri.startsWith('otpauth://totp/'), uri);
assert.ok(uri.includes('secret=' + RFC_SECRET), uri);
assert.ok(uri.includes('period=30'), uri);

// Recovery codes: 10 codes, correct shape, normalize+hash match across formatting.
const codes = Totp.generateRecoveryCodes();
assert.strictEqual(codes.length, Totp.RECOVERY_CODE_COUNT);
for(const code of codes){
    assert.match(code, /^[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}$/, code);
    assert.notStrictEqual(code, Totp.hashRecoveryCode(code));
}
assert.strictEqual(Totp.normalizeRecoveryCode('4F8A 3B1C'), '4f8a3b1c');
assert.strictEqual(
    Totp.hashRecoveryCode('4f8a-3b1c'),
    Totp.hashRecoveryCode('4F8A 3B1C')
);
assert.notStrictEqual(
    Totp.hashRecoveryCode('4f8a-3b1c'),
    Totp.hashRecoveryCode('4f8a-3b1d')
);

console.log('test-totp: all tests passed');
