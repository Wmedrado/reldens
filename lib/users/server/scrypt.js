/**
 *
 * Reldens - ScryptPassword
 *
 * scrypt-based password hashing for future/2FA use. Stronger alternative to the existing
 * Reldens Encryptor (@reldens/server-utils), which uses pbkdf2: higher memory cost makes
 * brute-force attacks harder. Migration is not automatic - existing pbkdf2 hashes remain
 * valid and must be re-hashed on next successful login.
 *
 */

const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;

/**
 * scrypt parameters, exported so callers and tests can reference the pinned cost.
 */
const SCRYPT_PARAMS = {N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, keyLen: KEYLEN};

/**
 * Hash a password with a fresh random 16-byte salt.
 * @param {string} password
 * @returns {Promise<string>} `${saltHex}:${keyHex}`
 */
function hashPassword(password)
{
    return new Promise((resolve, reject) => {
        const salt = randomBytes(16);
        scrypt(password, salt, KEYLEN, {N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P}, (err, key) => {
            if(err){
                reject(err);
            } else {
                resolve(`${salt.toString('hex')}:${key.toString('hex')}`);
            }
        });
    });
}

/**
 * Verify a password against a stored `${saltHex}:${keyHex}` hash.
 * Always resolves (never rejects): any malformed stored value simply fails verification.
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
function verifyPassword(password, stored)
{
    return new Promise((resolve) => {
        const [saltHex, keyHex] = stored.split(':');
        if(!saltHex || !keyHex){
            return resolve(false);
        }
        const salt = Buffer.from(saltHex, 'hex');
        const expected = Buffer.from(keyHex, 'hex');
        scrypt(password, salt, KEYLEN, {N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P}, (err, key) => {
            if(err || key.length !== expected.length){
                return resolve(false);
            }
            resolve(timingSafeEqual(key, expected));
        });
    });
}

/**
 * Cryptographically secure random token (32 bytes, 64 hex chars).
 * @returns {string}
 */
function newToken()
{
    return randomBytes(32).toString('hex');
}

module.exports.ScryptPassword = {
    hashPassword,
    verifyPassword,
    newToken,
    SCRYPT_PARAMS
};
