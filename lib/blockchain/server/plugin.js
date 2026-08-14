/**
 *
 * Reldens - BlockchainPlugin
 *
 * Server side plugin for the blockchain feature: non-custodial Solana wallet
 * linking (challenge + signature verification), token balance reads, NFT
 * ownership verification, and holder tiers.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { Logger, sc } = require('@reldens/utils');
const { WalletLinkManager } = require('./wallet-link-manager');
const { isSolanaAddress, verifySolanaSignature, decodeBase58 } = require('./wallet-verify');
const { walletLinkRateLimited } = require('./rate-limit');
const { cachedTokenBalance, holderInfoForPubkey } = require('./token-balance');
const { NftBindingService } = require('./nft-binding');
const { Faucet } = require('./faucet');
const { attachBlockchainRoutes } = require('./http-routes');

/**
 * @typedef {import('@reldens/utils').EventsManagerSingleton} EventsManagerSingleton
 * @typedef {import('@reldens/storage').BaseDataServer} BaseDataServer
 */
class BlockchainPlugin extends PluginInterface
{

    /**
     * @param {Object} props
     * @param {EventsManagerSingleton} [props.events]
     * @param {BaseDataServer} [props.dataServer]
     * @param {Object} [props.config]
     * @param {Object} [props.featuresManager]
     * @param {Object} [props.themeManager]
     * @returns {Promise<void>}
     */
    async setup(props)
    {
        /** @type {EventsManagerSingleton|boolean} */
        this.events = sc.get(props, 'events', false);
        if(!this.events){
            Logger.error('EventsManager undefined in BlockchainPlugin.');
        }
        /** @type {BaseDataServer|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
        if(!this.dataServer){
            Logger.error('DataServer undefined in BlockchainPlugin.');
        }
        /** @type {Object|boolean} */
        this.config = sc.get(props, 'config', false);
        if(!this.config){
            Logger.error('Config undefined in BlockchainPlugin.');
        }
        /** @type {Object|boolean} */
        this.featuresManager = sc.get(props, 'featuresManager', false);
        /** @type {Object|boolean} */
        this.themeManager = sc.get(props, 'themeManager', false);
        /** @type {WalletLinkManager} */
        this.walletLinkManager = new WalletLinkManager({dataServer: this.dataServer, config: this.config});
        /** @type {NftBindingService} */
        this.nftBinding = new NftBindingService({dataServer: this.dataServer, config: this.config, events: this.events});
        /** @type {Faucet} */
        this.faucet = new Faucet({dataServer: this.dataServer, config: this.config});
        this.faucet.setGrantCallback(async (userId, amount) => {
            // @TODO - Wire the grant into the token balance / ledger economy stub.
            Logger.info('BlockchainPlugin: faucet grant.', {userId, amount});
        });
        this.mapConfiguration();
        this.listenEvents();
    }

    /**
     * Map the blockchain configuration from the database config with
     * environment variables as defaults.
     *
     * @returns {boolean}
     */
    mapConfiguration()
    {
        if(!this.config){
            return false;
        }
        let env = process.env;
        let config = 'server/blockchain/';
        /** @type {boolean} */
        this.isEnabled = !this.config.getWithoutLogs(config+'disabled', 1 === Number(env.RELDENS_WALLET_DISABLED || 0));
        /** @type {string} */
        this.gameName = this.config.getWithoutLogs(config+'gameName', env.RELDENS_GAME_NAME || 'Reldens');
        /** @type {string} */
        this.rpcUrl = this.config.getWithoutLogs(
            config+'rpcUrl',
            env.RELDENS_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
        );
        /** @type {string} */
        this.tokenMint = this.config.getWithoutLogs(config+'tokenMint', env.RELDENS_TOKEN_MINT || '');
        /** @type {number} */
        this.tokenMaxSupply = Number(this.config.getWithoutLogs(config+'maxSupply', env.RELDENS_TOKEN_MAX_SUPPLY || 1000000000));
        return true;
    }

    /**
     * @returns {boolean}
     */
    listenEvents()
    {
        if(!this.events){
            return false;
        }
        // Wallet auth is performed by wrapping the login room onAuth so the
        // challenge consumption + signature verification can complete
        // (asynchronously) BEFORE the connection is accepted.
        this.events.on('reldens.roomLoginOnCreate', (event) => {
            this.wrapRoomLoginOnAuth(event);
        });
        // Synchronous pre-check: malformed wallet auth input is denied in the
        // same tick the event is emitted (no async work involved).
        this.events.on('reldens.roomLoginOnAuth', (event) => {
            this.validateWalletAuthInput(event);
        });
        this.events.on('reldens.beforeSuperInitialGameData', async (superInitialGameData, roomGame, client, userModel) => {
            await this.enrichInitialGameData(superInitialGameData, userModel);
        });
        this.events.on('reldens.serverConfigFeaturesReady', (props) => {
            if(props?.configProcessor){
                this.gameName = props.configProcessor.get('server/blockchain/gameName', this.gameName);
                this.isEnabled = !props.configProcessor.get(
                    'server/blockchain/disabled',
                    1 === Number(process.env.RELDENS_WALLET_DISABLED || 0)
                );
            }
        });
        // The express app is only available on the serverManager after the app
        // server is created (manager.js createAppServer), so routes are
        // attached here, right before the server listens.
        this.events.on('reldens.serverBeforeListen', (event) => {
            this.attachHttpRoutes(event);
        });
        // NFT binding hooks the exchange FINALIZED event on the shared
        // EventsManagerSingleton (default for ExchangePlatform instances).
        this.nftBinding?.listenEvents();
        return true;
    }

    /**
     * Attach the blockchain HTTP routes to the express app exposed by the
     * server manager on the reldens.serverBeforeListen event.
     *
     * @param {Object} event
     * @returns {boolean}
     */
    attachHttpRoutes(event)
    {
        let serverManager = sc.get(event, 'serverManager', false);
        let app = serverManager?.app || false;
        if(!app){
            Logger.error('BlockchainPlugin: express app not available on reldens.serverBeforeListen.');
            return false;
        }
        this.app = app;
        return attachBlockchainRoutes({app, plugin: this});
    }

    /**
     * Wrap the login room onAuth so wallet link verification runs after the
     * regular authentication and before the connection is accepted. Throwing
     * from the wrapper denies the connection.
     *
     * @param {Object} event
     */
    wrapRoomLoginOnAuth(event)
    {
        if(!this.isEnabled){
            return;
        }
        let roomLogin = sc.get(event, 'roomLogin', false);
        if(!roomLogin || roomLogin.blockchainOnAuthWrapped){
            return;
        }
        roomLogin.blockchainOnAuthWrapped = true;
        let originalOnAuth = roomLogin.onAuth.bind(roomLogin);
        roomLogin.onAuth = async (client, options, request) => {
            let userModel = await originalOnAuth(client, options, request);
            await this.verifyWalletLinkOnLogin(options, request, userModel);
            return userModel;
        };
    }

    /**
     * Synchronous validation of the wallet auth fields on the login options.
     * Malformed input (wrong address format, wrong signature length, missing
     * nonce) denies the connection in the same tick.
     *
     * @param {Object} event
     */
    validateWalletAuthInput(event)
    {
        if(!this.isEnabled){
            return;
        }
        let options = sc.get(event, 'options', false);
        if(!options || !this.isWalletAuthRequested(options)){
            return;
        }
        if(!isSolanaAddress(options.walletAddress)){
            event.result.confirm = false;
            Logger.warning('BlockchainPlugin: invalid wallet address on login options.');
            return;
        }
        let signatureBytes = decodeBase58(options.walletSignature || '');
        if(!signatureBytes || 64 !== signatureBytes.length){
            event.result.confirm = false;
            Logger.warning('BlockchainPlugin: invalid wallet signature on login options.');
            return;
        }
        if(!options.walletNonce || 'string' !== typeof options.walletNonce){
            event.result.confirm = false;
            Logger.warning('BlockchainPlugin: missing wallet nonce on login options.');
        }
    }

    /**
     * Check if the login options carry a wallet authentication request.
     *
     * @param {Object} options
     * @returns {boolean}
     */
    isWalletAuthRequested(options)
    {
        return Boolean(options.walletAddress && options.walletSignature && options.walletNonce);
    }

    /**
     * Full wallet link verification: consume the challenge, verify the
     * signature, and link the wallet. Throws on any failure.
     *
     * @param {Object} options
     * @param {Object} request
     * @param {Object} userModel
     * @returns {Promise<boolean>}
     */
    async verifyWalletLinkOnLogin(options, request, userModel)
    {
        if(!this.isEnabled || !this.isWalletAuthRequested(options)){
            return true;
        }
        let accountId = Number(userModel.id);
        let rateLimit = walletLinkRateLimited(request || {}, accountId);
        if(!rateLimit.allowed){
            Logger.warning('BlockchainPlugin: wallet link rate limited.', {accountId});
            throw new Error('Could not connect to the game.');
        }
        let challenge = await this.walletLinkManager.consumeChallenge(
            options.walletNonce,
            accountId,
            options.walletAddress
        );
        if(!challenge){
            Logger.warning('BlockchainPlugin: wallet challenge expired or already used.', {accountId});
            throw new Error('Could not connect to the game.');
        }
        if(!verifySolanaSignature(challenge.message, options.walletSignature, options.walletAddress)){
            Logger.warning('BlockchainPlugin: wallet signature verification failed.', {accountId});
            throw new Error('Could not connect to the game.');
        }
        let linked = await this.walletLinkManager.linkWallet(accountId, options.walletAddress);
        if(!linked){
            Logger.warning('BlockchainPlugin: wallet already linked to another account.', {accountId});
            throw new Error('Could not connect to the game.');
        }
        Logger.info('BlockchainPlugin: wallet linked for account "'+accountId+'".');
        return true;
    }

    /**
     * Enrich the super initial game data with the linked wallet and, when
     * linked, the holder tier + balance.
     *
     * @param {Object} superInitialGameData
     * @param {Object} userModel
     * @returns {Promise<boolean>}
     */
    async enrichInitialGameData(superInitialGameData, userModel)
    {
        if(!this.isEnabled || !userModel){
            return false;
        }
        let wallet = await this.walletLinkManager.walletForAccount(userModel.id);
        if(!wallet){
            superInitialGameData.wallet = null;
            superInitialGameData.walletHolder = {tier: 0, balance: 0};
            return true;
        }
        superInitialGameData.wallet = {
            pubkey: wallet.pubkey,
            linkedAt: wallet.linked_at
        };
        superInitialGameData.walletHolder = await holderInfoForPubkey(wallet.pubkey);
        return true;
    }

    /**
     * Issue a wallet link challenge for a player.
     *
     * @param {number} userId
     * @param {Object} [req]
     * @returns {Promise<Object|boolean>}
     */
    async issueChallengeForPlayer(userId, req = {})
    {
        return this.walletLinkManager.issueChallenge(req, Number(userId), req?.walletAddress || '');
    }

    /**
     * The cached token balance for a player's linked wallet, or null.
     *
     * @param {number} userId
     * @returns {Promise<number|null>}
     */
    async tokenBalanceForPlayer(userId)
    {
        let wallet = await this.walletLinkManager.walletForAccount(userId);
        if(!wallet){
            return null;
        }
        return cachedTokenBalance(wallet.pubkey);
    }

}

module.exports.BlockchainPlugin = BlockchainPlugin;
