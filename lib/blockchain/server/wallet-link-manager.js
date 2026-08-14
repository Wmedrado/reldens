/**
 *
 * Reldens - Wallet Link Manager
 *
 * Manages wallet challenge issuance/consumption and wallet links persistence.
 * The chain is the source of truth for wallet ownership; this server only
 * observes it. No private keys, seeds, or funds ever touch the server.
 *
 */

const { randomBytes } = require('node:crypto');
const { Logger, sc } = require('@reldens/utils');
const { BlockchainConst } = require('../constants');
const { buildLinkMessage } = require('./wallet-verify');

/**
 * @typedef {import('@reldens/storage').BaseDataServer} BaseDataServer
 * @typedef {import('@reldens/storage').BaseDriver} BaseDriver
 */
class WalletLinkManager
{

    /**
     * @param {Object} props
     * @param {BaseDataServer} [props.dataServer]
     * @param {Object} [props.config]
     */
    constructor(props)
    {
        /** @type {BaseDataServer|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
        if(!this.dataServer){
            Logger.error('Data Server undefined in WalletLinkManager.');
        }
        /** @type {Object|boolean} */
        this.config = sc.get(props, 'config', false);
        /** @type {BaseDriver|boolean} */
        this.walletsRepository = this.dataServer?.getEntity('blockchain_wallets') || false;
        /** @type {BaseDriver|boolean} */
        this.challengesRepository = this.dataServer?.getEntity('blockchain_wallet_challenges') || false;
    }

    /**
     * Delete expired, unconsumed challenges.
     *
     * @returns {Promise<boolean>}
     */
    async pruneExpiredChallenges()
    {
        if(!this.challengesRepository){
            return false;
        }
        let now = new Date();
        let challenges = await this.challengesRepository.loadAll();
        if(!sc.isArray(challenges)){
            return false;
        }
        for(let challenge of challenges){
            let isConsumed = 1 === Number(challenge.consumed);
            let expiresAt = new Date(challenge.expires_at);
            if(!isConsumed && expiresAt < now){
                await this.challengesRepository.deleteById(challenge.id);
            }
        }
        return true;
    }

    /**
     * Issue a single-use link challenge for an account + wallet address.
     *
     * @param {Object} req
     * @param {number} accountId
     * @param {string} address
     * @returns {Promise<Object|boolean>}
     */
    async issueChallenge(req, accountId, address)
    {
        if(!this.challengesRepository){
            Logger.error('Challenges repository undefined in WalletLinkManager.');
            return false;
        }
        await this.pruneExpiredChallenges();
        let nonce = randomBytes(16).toString('hex');
        let issuedAt = new Date().toISOString();
        let domain = (req?.headers?.host ?? '').split(':')[0] || 'reldens';
        let gameName = this.config?.getWithoutLogs?.('server/blockchain/gameName', 'Reldens') || 'Reldens';
        let message = buildLinkMessage({
            domain: domain,
            accountId: accountId,
            address: address,
            nonce: nonce,
            issuedAt: issuedAt,
            gameName: gameName
        });
        let expiresAt = new Date(Date.now() + BlockchainConst.LINK_CHALLENGE_TTL_MINUTES * 60 * 1000);
        let createResult = await this.challengesRepository.create({
            user_id: accountId,
            nonce: nonce,
            address: address,
            message: message,
            expires_at: expiresAt,
            consumed: 0
        });
        if(!createResult){
            Logger.critical('Wallet challenge insert error.', {accountId, address});
            return false;
        }
        return {nonce: nonce, message: message};
    }

    /**
     * Consume a challenge: validate it exists, belongs to the account, matches
     * the address, is not consumed and not expired, then mark it consumed.
     * Returns the challenge row or null.
     *
     * @param {string} nonce
     * @param {number} accountId
     * @param {string} address
     * @returns {Promise<Object|null>}
     */
    async consumeChallenge(nonce, accountId, address)
    {
        if(!this.challengesRepository){
            return null;
        }
        let challenge = await this.challengesRepository.loadOneBy('nonce', nonce);
        if(!challenge){
            return null;
        }
        if(1 === Number(challenge.consumed)){
            return null;
        }
        if(new Date(challenge.expires_at) < new Date()){
            return null;
        }
        if(Number(challenge.user_id) !== Number(accountId)){
            return null;
        }
        if(address && challenge.address !== address){
            return null;
        }
        let updateResult = await this.challengesRepository.updateById(challenge.id, {consumed: 1});
        if(!updateResult){
            Logger.critical('Wallet challenge consume error.', {nonce, accountId});
            return null;
        }
        return challenge;
    }

    /**
     * Link a wallet address to an account. Returns false when the address is
     * already linked to another account (409 case), true otherwise.
     *
     * @param {number} accountId
     * @param {string} address
     * @returns {Promise<boolean>}
     */
    async linkWallet(accountId, address)
    {
        if(!this.walletsRepository){
            Logger.error('Wallets repository undefined in WalletLinkManager.');
            return false;
        }
        let existingByAddress = await this.walletsRepository.loadOneBy('pubkey', address);
        if(existingByAddress && Number(existingByAddress.user_id) !== Number(accountId)){
            return false;
        }
        let existingForAccount = await this.walletForAccount(accountId);
        if(existingForAccount){
            await this.walletsRepository.updateById(existingForAccount.id, {
                pubkey: address,
                linked_at: new Date()
            });
            return true;
        }
        let createResult = await this.walletsRepository.create({
            user_id: accountId,
            pubkey: address,
            linked_at: new Date()
        });
        if(!createResult){
            Logger.critical('Wallet link insert error.', {accountId, address});
            return false;
        }
        return true;
    }

    /**
     * The linked wallet row for an account, or null.
     *
     * @param {number} accountId
     * @returns {Promise<Object|null>}
     */
    async walletForAccount(accountId)
    {
        if(!this.walletsRepository){
            return null;
        }
        return this.walletsRepository.loadOneBy('user_id', accountId);
    }

    /**
     * Unlink any wallet from an account.
     *
     * @param {number} accountId
     * @returns {Promise<boolean>}
     */
    async unlink(accountId)
    {
        if(!this.walletsRepository){
            return false;
        }
        let existing = await this.walletForAccount(accountId);
        if(!existing){
            return true;
        }
        return Boolean(await this.walletsRepository.deleteById(existing.id));
    }

}

module.exports.WalletLinkManager = WalletLinkManager;
