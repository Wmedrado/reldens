/**
 *
 * Reldens - Blockchain HTTP Routes
 *
 * Express routes for the wallet link + balance + faucet + nft surfaces. The
 * game client needs these HTTP endpoints because the login flow requires a
 * challenge before the WebSocket auth.
 *
 * @NOTE - V1 endpoints. There is no bearer-token layer in Reldens yet, so the
 * accountId in the path/body is client-asserted. A real auth middleware must
 * gate these routes before production (see the risk note in the challenge
 * route).
 *
 */

const express = require('express');
const { Logger } = require('@reldens/utils');
const { verifySolanaSignature, isSolanaAddress } = require('./wallet-verify');
const { walletLinkRateLimited } = require('./rate-limit');

const JSON_PARSED_FLAG = '__reldensBlockchainJsonParsed__';

/**
 * Mount the blockchain HTTP routes on an express app.
 *
 * @param {Object} props
 * @param {Object} props.app
 * @param {Object} props.plugin
 * @returns {boolean}
 */
function attachBlockchainRoutes({app, plugin})
{
    if(!app || !plugin){
        Logger.error('BlockchainHttpRoutes: express app or plugin undefined.');
        return false;
    }
    if(!app[JSON_PARSED_FLAG]){
        app.use(express.json());
        app[JSON_PARSED_FLAG] = true;
    }
    // Issue a wallet link challenge. @NOTE - V1: accountId is client-asserted,
    // there is no auth middleware yet; this endpoint must be gated before
    // production or any account could be spammed with challenges.
    app.post('/api/blockchain/wallet/challenge', async (req, res) => {
        try {
            let accountId = Number(req.body?.accountId);
            let walletAddress = String(req.body?.walletAddress || '');
            if(!accountId || !isSolanaAddress(walletAddress)){
                return res.status(400).json({error: 'Invalid accountId or walletAddress.'});
            }
            let challenge = await plugin.issueChallengeForPlayer(accountId, {
                headers: {host: req.headers?.host || ''},
                walletAddress: walletAddress
            });
            if(!challenge){
                return res.status(400).json({error: 'Could not issue wallet challenge.'});
            }
            return res.json({nonce: challenge.nonce, message: challenge.message});
        } catch (error) {
            Logger.error('BlockchainHttpRoutes: challenge route error.', error);
            return res.status(500).json({error: 'Internal error.'});
        }
    });
    // Verify a wallet link: consume the challenge, verify the signature, link
    // the wallet. @NOTE - V1: accountId is client-asserted, no auth middleware
    // yet; must be gated before production.
    app.post('/api/blockchain/wallet/link', async (req, res) => {
        try {
            let accountId = Number(req.body?.accountId);
            let walletAddress = String(req.body?.walletAddress || '');
            let signature = String(req.body?.signature || '');
            let nonce = String(req.body?.nonce || '');
            if(!accountId || !isSolanaAddress(walletAddress) || !signature || !nonce){
                return res.status(400).json({error: 'Invalid wallet link payload.'});
            }
            let rateLimit = walletLinkRateLimited(req, accountId);
            if(!rateLimit.allowed){
                res.set('Retry-After', String(rateLimit.resetSeconds));
                return res.status(429).json({error: 'Too many wallet link attempts.'});
            }
            let challenge = await plugin.walletLinkManager.consumeChallenge(nonce, accountId, walletAddress);
            if(!challenge){
                return res.status(401).json({error: 'Challenge invalid, expired or already used.'});
            }
            if(!verifySolanaSignature(challenge.message, signature, walletAddress)){
                return res.status(401).json({error: 'Wallet signature verification failed.'});
            }
            let linked = await plugin.walletLinkManager.linkWallet(accountId, walletAddress);
            if(!linked){
                return res.status(409).json({error: 'Wallet already linked to another account.'});
            }
            return res.json({linked: true, pubkey: walletAddress});
        } catch (error) {
            Logger.error('BlockchainHttpRoutes: wallet link route error.', error);
            return res.status(500).json({error: 'Internal error.'});
        }
    });
    app.get('/api/blockchain/wallet/:accountId', async (req, res) => {
        try {
            let accountId = Number(req.params.accountId);
            let wallet = await plugin.walletLinkManager.walletForAccount(accountId);
            return res.json({wallet: wallet});
        } catch (error) {
            Logger.error('BlockchainHttpRoutes: wallet get route error.', error);
            return res.status(500).json({error: 'Internal error.'});
        }
    });
    app.get('/api/blockchain/token/balance/:accountId', async (req, res) => {
        try {
            let accountId = Number(req.params.accountId);
            let balance = await plugin.tokenBalanceForPlayer(accountId);
            return res.json({balance: balance});
        } catch (error) {
            Logger.error('BlockchainHttpRoutes: token balance route error.', error);
            return res.status(500).json({error: 'Internal error.'});
        }
    });
    app.get('/api/blockchain/faucet/status/:accountId', async (req, res) => {
        try {
            let accountId = Number(req.params.accountId);
            return res.json(await plugin.faucet.statusForUser(accountId));
        } catch (error) {
            Logger.error('BlockchainHttpRoutes: faucet status route error.', error);
            return res.status(500).json({error: 'Internal error.'});
        }
    });
    app.post('/api/blockchain/faucet/claim/:accountId', async (req, res) => {
        try {
            let accountId = Number(req.params.accountId);
            let result = await plugin.faucet.claimForUser(accountId);
            if(!result.ok && 'cooldown' === result.reason){
                res.set('Retry-After', String(result.retryAfterSeconds));
                return res.status(429).json(result);
            }
            return res.json(result);
        } catch (error) {
            Logger.error('BlockchainHttpRoutes: faucet claim route error.', error);
            return res.status(500).json({error: 'Internal error.'});
        }
    });
    return true;
}

module.exports.attachBlockchainRoutes = attachBlockchainRoutes;
