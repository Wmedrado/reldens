/**
 *
 * Reldens - test-blockchain-wallet-verify
 *
 * Standalone tests for the Solana wallet signature verification helpers.
 * A Solana wallet signMessage() is exactly ed25519 over the raw UTF-8 bytes,
 * so a @noble/curves keypair is an accurate stand-in for a real wallet here.
 * A deterministic test-only private key is used so the vectors are stable.
 *
 */

const assert = require('assert');
const { ed25519 } = require('@noble/curves/ed25519');
const bs58 = require('bs58');
const {
    buildLinkMessage,
    decodeBase58,
    isSolanaAddress,
    verifySolanaSignature
} = require('../lib/blockchain/server/wallet-verify');

// Deterministic test-only private key (never used with real funds):
const TEST_PRIV = new Uint8Array(32).fill(171);

function makeWallet(seedByte)
{
    let priv = new Uint8Array(32).fill(seedByte);
    let pub = ed25519.getPublicKey(priv);
    return {priv: priv, address: bs58.encode(pub)};
}

function sign(message, priv)
{
    return bs58.encode(ed25519.sign(new TextEncoder().encode(message), priv));
}

try {
    // Fixed deterministic vector: proves the full sign -> verify path.
    let wallet = makeWallet(171);
    let message = buildLinkMessage({
        domain: 'localhost',
        accountId: 42,
        address: wallet.address,
        nonce: 'abc123def456',
        issuedAt: '2026-06-16T00:00:00.000Z'
    });
    let signature = sign(message, wallet.priv);
    assert.strictEqual(verifySolanaSignature(message, signature, wallet.address), true);

    // Tampered message is rejected.
    assert.strictEqual(verifySolanaSignature(message+' ', signature, wallet.address), false);

    // A signature produced by a different wallet is rejected.
    let other = makeWallet(1);
    assert.strictEqual(verifySolanaSignature(message, sign(message, other.priv), wallet.address), false);

    // A valid signature presented under a different address is rejected.
    assert.strictEqual(verifySolanaSignature(message, signature, other.address), false);

    // Garbage / malformed input never throws.
    assert.strictEqual(verifySolanaSignature(message, 'not-a-signature', wallet.address), false);
    assert.strictEqual(verifySolanaSignature(message, bs58.encode(new Uint8Array(10)), wallet.address), false);
    assert.strictEqual(verifySolanaSignature(message, signature, 'has0OIlchars'), false);
    assert.strictEqual(verifySolanaSignature(message, '1'.repeat(129), '1'.repeat(129)), false);

    // decodeBase58 length guard: the decode is O(n^2) in the input length, so
    // anything past the 128-char cap must be rejected before decoding.
    let sig = sign('m', TEST_PRIV);
    assert.ok(sig.length <= 128);
    assert.notStrictEqual(decodeBase58(sig), null);
    assert.notStrictEqual(decodeBase58('1'.repeat(128)), null);
    assert.strictEqual(decodeBase58('1'.repeat(129)), null);
    assert.strictEqual(decodeBase58('A'.repeat(10000)), null);
    assert.strictEqual(isSolanaAddress('1'.repeat(129)), false);

    // isSolanaAddress: 32-byte base58 pubkeys only.
    assert.strictEqual(isSolanaAddress(makeWallet(2).address), true);
    assert.strictEqual(isSolanaAddress(123), false);
    assert.strictEqual(isSolanaAddress(''), false);
    assert.strictEqual(isSolanaAddress(bs58.encode(new Uint8Array(31))), false);
    assert.strictEqual(isSolanaAddress('not valid base58 +/='), false);

    // buildLinkMessage embeds account, wallet, nonce, domain, and game name.
    let linkMessage = buildLinkMessage({
        domain: 'play.example.com',
        accountId: 7,
        address: 'WALLET123',
        nonce: 'N1',
        issuedAt: 'T'
    });
    assert.ok(linkMessage.includes('Account: #7'));
    assert.ok(linkMessage.includes('Wallet: WALLET123'));
    assert.ok(linkMessage.includes('Nonce: N1'));
    assert.ok(linkMessage.includes('play.example.com'));
    let customGameMessage = buildLinkMessage({
        domain: 'localhost',
        accountId: 1,
        address: 'WALLET123',
        nonce: 'N1',
        issuedAt: 'T',
        gameName: 'MyGame'
    });
    assert.ok(customGameMessage.includes('MyGame'));
    assert.ok(!customGameMessage.includes('World of ClaudeCraft'));

    console.log('test-blockchain-wallet-verify: all tests passed');
} catch (err) {
    throw err;
}
