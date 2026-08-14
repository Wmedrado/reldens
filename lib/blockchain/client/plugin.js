/**
 *
 * Reldens - Blockchain Client Plugin
 *
 * Initializes and manages the blockchain feature on the client side: wallet
 * connection through Wallet Standard and attaching wallet link data to the
 * game join options.
 *
 */

const { ClientWalletManager } = require('./wallet');
const { PluginInterface } = require('../../features/plugin-interface');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('@reldens/utils').EventsManagerSingleton} EventsManagerSingleton
 * @typedef {import('../../game/client/game-manager').GameManager} GameManager
 */
class BlockchainClientPlugin extends PluginInterface
{

    /**
     * @param {Object} props
     * @param {GameManager} [props.gameManager]
     * @param {EventsManagerSingleton} [props.events]
     * @returns {Promise<void>}
     */
    async setup(props)
    {
        /** @type {GameManager|boolean} */
        this.gameManager = sc.get(props, 'gameManager', false);
        if(!this.gameManager){
            Logger.error('Game Manager undefined in BlockchainClientPlugin.');
        }
        /** @type {EventsManagerSingleton|boolean} */
        this.events = sc.get(props, 'events', false);
        if(!this.events){
            Logger.error('EventsManager undefined in BlockchainClientPlugin.');
        }
        /** @type {ClientWalletManager} */
        this.walletManager = new ClientWalletManager();
        // expose the wallet manager for the game implementation:
        this.gameManager.walletManager = this.walletManager;
        // wallet-connect (Reown AppKit) is gated behind a project id from the
        // database config or the environment:
        let projectId = this.readWalletConnectProjectId();
        if(projectId){
            this.walletManager.setWalletConnectProjectId(projectId);
        }
        // pending link data (nonce + message + address), set by the game
        // implementation before the login form is submitted:
        /** @type {Object|boolean} */
        this.pendingLink = false;
        this.listenEvents();
    }

    /**
     * @returns {string}
     */
    readWalletConnectProjectId()
    {
        let projectId = '';
        try {
            if(this.gameManager?.config){
                projectId = String(this.gameManager.config.getWithoutLogs('client/blockchain/reownProjectId', '') || '');
            }
        } catch (error) {
            // config getter may not be ready; fall through to the environment:
        }
        if(!projectId && typeof process !== 'undefined' && process && process.env){
            projectId = String(process.env.RELDENS_REOWN_PROJECT_ID || '');
        }
        return projectId.trim();
    }

    /**
     * @returns {ClientWalletManager}
     */
    getWalletManager()
    {
        return this.walletManager;
    }

    /**
     * @returns {boolean}
     */
    listenEvents()
    {
        if(!this.events){
            return false;
        }
        // attach wallet auth fields to the join options when a signed link
        // challenge is pending and the wallet is still connected:
        this.events.on('reldens.beforeJoinGame', async (event) => {
            await this.attachWalletLinkToJoinOptions(event);
        });
        return true;
    }

    /**
     * Sign the pending link challenge with the connected wallet and attach the
     * wallet auth fields to the join options.
     *
     * @param {Object} event
     * @returns {Promise<boolean>}
     */
    async attachWalletLinkToJoinOptions(event)
    {
        let formData = sc.get(event, 'formData', false);
        if(!formData || !this.pendingLink){
            return false;
        }
        let walletState = this.walletManager.currentState();
        if(!walletState.isConnected || !walletState.address){
            Logger.warning('BlockchainClientPlugin: wallet not connected for link request.');
            return false;
        }
        let pendingLink = this.pendingLink;
        this.pendingLink = false;
        let signature = await this.walletManager.signMessageBase58(pendingLink.message);
        formData.walletAddress = walletState.address;
        formData.walletSignature = signature;
        formData.walletNonce = pendingLink.nonce;
        return true;
    }

    /**
     * Request a wallet link on the next game join: the provided challenge
     * message will be signed by the connected wallet and sent with the join
     * options.
     *
     * @param {Object} challenge
     * @param {string} challenge.nonce
     * @param {string} challenge.message
     * @returns {boolean}
     */
    requestWalletLink(challenge)
    {
        if(!challenge || !challenge.nonce || !challenge.message){
            Logger.error('BlockchainClientPlugin: invalid wallet link challenge.');
            return false;
        }
        this.pendingLink = challenge;
        return true;
    }

}

module.exports.BlockchainClientPlugin = BlockchainClientPlugin;
