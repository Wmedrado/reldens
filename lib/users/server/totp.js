/**
 *
 * Reldens - Totp
 *
 * RFC 6238 time-based one-time passwords (TOTP) and single-use recovery codes, implemented
 * with only Node's built-in crypto (HMAC-SHA1). This module is pure and host-agnostic: it
 * touches no DB, no env, and no clock of its own (the caller passes nowMs), so tests can
 * drive it directly with the RFC test vectors.
 *
 * The standard knobs are fixed to the values every authenticator app defaults to: SHA-1,
 * 6 digits, a 30-second period. verifyTotp returns the matched counter (not a bare boolean)
 * so the login path can reject a code that has already been spent inside its own window
 * (replay guard).
 *
 */

const { createHmac, randomBytes, createHash, timingSafeEqual } = require('node:crypto');

const TOTP_DIGITS = 6;
const TOTP_PERIOD_SEC = 30;
// Steps on either side of 'now' accepted, to tolerate clock drift (1 => +/- 30s).
const TOTP_DEFAULT_WINDOW = 1;
// Number of single-use recovery codes minted when 2FA is enabled.
const RECOVERY_CODE_COUNT = 10;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * RFC 4648 base32 encode (no padding). Renders a freshly minted secret into the form
 * authenticator apps expect inside an otpauth:// URI.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function base32Encode(bytes)
{
    let bits = 0;
    let value = 0;
    let out = '';
    for(let i = 0; i < bytes.length; i++){
        value = (value << 8) | bytes[i];
        bits += 8;
        while(bits >= 5){
            out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if(bits > 0){
        out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }
    return out;
}

/**
 * RFC 4648 base32 decode. Case-insensitive; spaces and '=' padding are ignored so a
 * formatted secret a user pasted still decodes.
 * @param {string} input
 * @returns {Buffer}
 */
function base32Decode(input)
{
    const clean = input.toUpperCase().replace(/[\s=]/g, '');
    let bits = 0;
    let value = 0;
    const out = [];
    for(const ch of clean){
        const idx = BASE32_ALPHABET.indexOf(ch);
        if(idx === -1){
            throw new Error('invalid base32 character');
        }
        value = (value << 5) | idx;
        bits += 5;
        if(bits >= 8){
            out.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return Buffer.from(out);
}

/**
 * Fresh 160-bit (20-byte) secret, base32-encoded. 160 bits matches the HMAC-SHA1 block
 * expectation and the RFC reference seed length.
 * @returns {string}
 */
function generateSecret()
{
    return base32Encode(randomBytes(20));
}

/**
 * HOTP (RFC 4226): the building block of TOTP. counter is the moving factor.
 * @param {Buffer} secret
 * @param {number} counter
 * @param {number} digits
 * @returns {string}
 */
function hotp(secret, counter, digits)
{
    const buf = Buffer.alloc(8);
    // JS numbers are 53-bit safe; TOTP counters (seconds/30) stay far below that, so
    // writing the low 32 bits plus the high bits via division is exact.
    buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buf.writeUInt32BE(counter >>> 0, 4);
    const digest = createHmac('sha1', secret).update(buf).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[offset] & 0x7f) << 24)
        | ((digest[offset + 1] & 0xff) << 16)
        | ((digest[offset + 2] & 0xff) << 8)
        | (digest[offset + 3] & 0xff);
    return (binary % 10 ** digits).toString().padStart(digits, '0');
}

/**
 * Current counter for a clock reading, exposed so the login replay guard can compare a
 * freshly accepted counter against the last one it stored.
 * @param {number} nowMs
 * @param {number} [period]
 * @returns {number}
 */
function totpCounter(nowMs, period = TOTP_PERIOD_SEC)
{
    return Math.floor(nowMs / 1000 / period);
}

/**
 * The 6-digit code for a clock reading. For tests and dev display; the server never needs
 * to generate codes in production.
 * @param {string} secretBase32
 * @param {number} nowMs
 * @returns {string}
 */
function generateTotp(secretBase32, nowMs)
{
    return hotp(base32Decode(secretBase32), totpCounter(nowMs), TOTP_DIGITS);
}

/**
 * Verify a user-supplied code against the secret around the given time. Returns the
 * matched counter on success (so the caller can persist it for replay rejection) or null
 * on failure. Comparison is constant-time per candidate to avoid leaking which window
 * matched via timing.
 * @param {string} secretBase32
 * @param {string} code
 * @param {number} nowMs
 * @param {{window?: number, period?: number, digits?: number}} [opts]
 * @returns {number|null}
 */
function verifyTotp(secretBase32, code, nowMs, opts = {})
{
    const digits = opts.digits ?? TOTP_DIGITS;
    const period = opts.period ?? TOTP_PERIOD_SEC;
    const window = opts.window ?? TOTP_DEFAULT_WINDOW;
    const normalized = code.replace(/\s/g, '');
    if(!/^[0-9]+$/.test(normalized) || normalized.length !== digits){
        return null;
    }
    let secret;
    try {
        secret = base32Decode(secretBase32);
    } catch {
        return null;
    }
    const center = totpCounter(nowMs, period);
    const candidate = Buffer.from(normalized);
    for(let offset = -window; offset <= window; offset++){
        const counter = center + offset;
        if(counter < 0){
            continue;
        }
        const expected = Buffer.from(hotp(secret, counter, digits));
        if(expected.length === candidate.length && timingSafeEqual(expected, candidate)){
            return counter;
        }
    }
    return null;
}

/**
 * otpauth:// URI an authenticator app reads from a QR code. label and issuer are
 * percent-encoded so spaces in either survive.
 * @param {string} secretBase32
 * @param {string} account
 * @param {string} issuer
 * @returns {string}
 */
function otpauthUri(secretBase32, account, issuer)
{
    const label = encodeURIComponent(`${issuer}:${account}`);
    const params = new URLSearchParams({
        secret: secretBase32,
        issuer,
        algorithm: 'SHA1',
        digits: String(TOTP_DIGITS),
        period: String(TOTP_PERIOD_SEC)
    });
    return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * A batch of human-friendly single-use recovery codes (e.g. '4f8a-3b1c'). Shown to the
 * user ONCE at enrolment; only their SHA-256 hashes are stored, so a DB leak cannot
 * recover usable codes (same posture as the password hash).
 * @param {number} [count]
 * @returns {string[]}
 */
function generateRecoveryCodes(count = RECOVERY_CODE_COUNT)
{
    const codes = [];
    for(let i = 0; i < count; i++){
        // 64 bits of entropy (8 bytes) so a code is infeasible to guess even though it is
        // a bearer credential at login; grouped in fours for legibility.
        const hex = randomBytes(8).toString('hex'); // 16 hex chars
        codes.push(hex.replace(/(.{4})(?=.)/g, '$1-'));
    }
    return codes;
}

/**
 * Canonical form for hashing/compare: lowercase, strip the cosmetic dash and any stray
 * whitespace, so a user who types '4F8A 3B1C' still matches '4f8a-3b1c'.
 * @param {string} code
 * @returns {string}
 */
function normalizeRecoveryCode(code)
{
    return code.toLowerCase().replace(/[\s-]/g, '');
}

/**
 * @param {string} code
 * @returns {string} hex SHA-256 of the normalized code
 */
function hashRecoveryCode(code)
{
    return createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');
}

module.exports.Totp = {
    TOTP_DIGITS,
    TOTP_PERIOD_SEC,
    TOTP_DEFAULT_WINDOW,
    RECOVERY_CODE_COUNT,
    base32Encode,
    base32Decode,
    generateSecret,
    totpCounter,
    generateTotp,
    verifyTotp,
    otpauthUri,
    generateRecoveryCodes,
    normalizeRecoveryCode,
    hashRecoveryCode
};
