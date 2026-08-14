/**
 *
 * Reldens - Wallet Verify
 *
 * Pure (IO-free) helpers for non-custodial Solana wallet linking: address
 * validation, the challenge-message format, and ed25519 signature verification.
 * Kept separate from the wallet-link manager (which does DB work) so it can be
 * unit tested without a database.
 *
 */

const { ed25519 } = require('@noble/curves/ed25519');
const bs58 = require('bs58');
const { BlockchainConst } = require('../constants');

/**
 * Decode a base58 string to bytes. Rejects non-base58 characters and inputs
 * longer than MAX_BASE58_LEN (the decode is O(n^2) in the input length, so a
 * hostile caller could pin the event loop with a huge string otherwise).
 *
 * @param {string} s
 * @returns {Uint8Array|null}
 */
function decodeBase58(s)
{
    if(s.length > BlockchainConst.MAX_BASE58_LEN){
        return null;
    }
    if(!BlockchainConst.BASE58.test(s)){
        return null;
    }
    return bs58.decode(s);
}

/**
 * A Solana address is a 32-byte ed25519 public key, base58-encoded.
 *
 * @param {*} s
 * @returns {boolean}
 */
function isSolanaAddress(s)
{
    if('string' !== typeof s){
        return false;
    }
    let bytes = decodeBase58(s);
    return null !== bytes && 32 === bytes.length;
}

/**
 * Verify that `signatureB58` is a valid ed25519 signature of `message` by the
 * wallet `addressB58`. The verify call is wrapped because the inputs are
 * attacker-controlled and `@noble/curves` throws on malformed points - a forged
 * or garbage signature must read as `false`, never crash the request.
 *
 * @param {string} message
 * @param {string} signatureB58
 * @param {string} addressB58
 * @returns {boolean}
 */
function verifySolanaSignature(message, signatureB58, addressB58)
{
    let sig = decodeBase58(signatureB58);
    let pub = decodeBase58(addressB58);
    if(null === sig || null === pub || 64 !== sig.length || 32 !== pub.length){
        return false;
    }
    let msg = new TextEncoder().encode(message);
    try {
        return ed25519.verify(sig, msg, pub);
    } catch (error) {
        return false;
    }
}

/**
 * The exact human-readable text the wallet is asked to sign.
 *
 * Branding note: the game name is config-driven. The caller passes
 * server/blockchain/gameName via opts.gameName; the default is 'Reldens'.
 *
 * @param {Object} opts
 * @param {string} opts.domain
 * @param {number} opts.accountId
 * @param {string} opts.address
 * @param {string} opts.nonce
 * @param {string} opts.issuedAt
 * @param {string} [opts.gameName]
 * @returns {string}
 */
function buildLinkMessage(opts)
{
    let gameName = opts.gameName || 'Reldens';
    return [
        opts.domain+' wants you to link this Solana wallet to your '+gameName+' account.',
        '',
        'Account: #'+opts.accountId,
        'Wallet: '+opts.address,
        'Nonce: '+opts.nonce,
        'Issued At: '+opts.issuedAt,
        '',
        'Signing is free, proves you control this wallet, and authorizes no transaction.'
    ].join('\n');
}

module.exports.decodeBase58 = decodeBase58;
module.exports.isSolanaAddress = isSolanaAddress;
module.exports.verifySolanaSignature = verifySolanaSignature;
module.exports.buildLinkMessage = buildLinkMessage;
