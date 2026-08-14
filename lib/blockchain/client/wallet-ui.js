/**
 *
 * Reldens - Wallet Link UI
 *
 * Client UI for the wallet feature: a "Connect Wallet" button on the login
 * form and a "Link Wallet" button shown in the game HUD after login.
 *
 * DESIGN NOTE (link-after-login): the wallet address alone is not enough to
 * link an account. Linking requires a server-issued challenge (nonce + message)
 * tied to the logged account, signed by the wallet, and verified by the server.
 * The account id only exists AFTER authentication, so the connect button on the
 * login form is informational only (connect + store the address); the full
 * sign-to-link flow runs over the same-origin HTTP endpoints after the player
 * is logged in and joined a room:
 *
 *   POST /api/blockchain/wallet/challenge  {accountId, walletAddress} -> {message, nonce}
 *   POST /api/blockchain/wallet/link       {accountId, walletAddress, walletSignature, walletNonce}
 *
 * The HTTP routes are provided by the blockchain server plugin.
 *
 * Browser-only: all DOM access is guarded with typeof window/document checks so
 * the module also requires cleanly under Node for tests.
 *
 */

const { Logger, sc } = require('@reldens/utils');

const FALLBACK_SNIPPETS = {
    'wallet.connect': 'Connect Wallet',
    'wallet.disconnect': 'Disconnect Wallet',
    'wallet.connected': 'Wallet connected',
    'wallet.connecting': 'Connecting wallet...',
    'wallet.selectWallet': 'Select a wallet',
    'wallet.notSupported': 'No compatible wallet found in this browser.',
    'wallet.connectedAddress': 'Wallet connected: %address',
    'wallet.willLinkAfterLogin': 'Wallet will be linked after login.',
    'wallet.requiredForLogin': 'A wallet is required to log in.',
    'wallet.linkWallet': 'Link Wallet',
    'wallet.linking': 'Linking wallet...',
    'wallet.signed': 'Wallet signed, sending link request...',
    'wallet.linkSuccess': 'Wallet linked successfully.',
    'wallet.linkFailed': 'Wallet link failed. Please try again.',
    'wallet.signRejected': 'Wallet signature was rejected.',
    'wallet.challengeFailed': 'Could not obtain a wallet challenge.'
};

class WalletLinkUI
{

    /**
     * @param {Object} props
     * @param {import('../../game/client/game-manager').GameManager} [props.gameManager]
     * @param {import('@reldens/utils').EventsManager} [props.events]
     * @param {Object} [props.config]
     * @param {Object} [props.translator]
     * @param {Object} [props.walletManager]
     */
    constructor(props)
    {
        /** @type {import('../../game/client/game-manager').GameManager|boolean} */
        this.gameManager = sc.get(props, 'gameManager', false);
        /** @type {import('@reldens/utils').EventsManager|boolean} */
        this.events = sc.get(props, 'events', false);
        /** @type {Object|boolean} */
        this.config = sc.get(props, 'config', false);
        /** @type {Object|boolean} */
        this.translator = sc.get(props, 'translator', false);
        /** @type {Object|boolean} */
        this.walletManager = sc.get(props, 'walletManager', this.gameManager?.walletManager || false);
        /** @type {Object} */
        this.connectedState = this.walletManager ? this.walletManager.currentState() : {
            address: null,
            isConnected: false
        };
        /** @type {Function|null} */
        this.onLinkedCallback = null;
        /** @type {HTMLElement|null} */
        this.linkAreaElement = null;
        /** @type {HTMLElement|null} */
        this.linkButtonElement = null;
        /** @type {HTMLElement|null} */
        this.linkStatusElement = null;
        if(this.events){
            this.events.on('reldens.startGameAfter', () => {
                this.showLinkArea();
            });
        }
    }

    /**
     * @returns {Object|boolean}
     */
    getTranslator()
    {
        return this.translator || this.gameManager?.services?.translator || false;
    }

    /**
     * @returns {boolean}
     */
    canUseDom()
    {
        return 'undefined' !== typeof window && 'undefined' !== typeof document;
    }

    /**
     * @returns {Object|null}
     */
    getGameDom()
    {
        return this.gameManager?.gameDom || false;
    }

    /**
     * @param {string} selector
     * @returns {HTMLElement|null}
     */
    getElement(selector)
    {
        let gameDom = this.getGameDom();
        if(gameDom){
            return gameDom.getElement(selector);
        }
        if(!this.canUseDom()){
            return null;
        }
        return document.querySelector(selector);
    }

    /**
     * Translate a snippet key with an English fallback map for the pre-engine
     * login screen, where the translator may not be ready yet.
     *
     * @param {string} key
     * @returns {string}
     */
    t(key)
    {
        let translator = this.getTranslator();
        if(translator && typeof translator.t === 'function'){
            return translator.t(key);
        }
        return sc.get(FALLBACK_SNIPPETS, key, key);
    }

    /**
     * Wire the wallet connect button into the login form and, when present,
     * inject a wallet connect button into the register form too.
     *
     * @returns {boolean}
     */
    render()
    {
        if(!this.canUseDom() || !this.walletManager){
            return false;
        }
        this.setupLoginWalletButton();
        this.setupRegisterWalletButton();
        if(typeof this.walletManager.subscribe === 'function'){
            let unsubscribe = this.walletManager.subscribe(() => {
                this.updateStatus();
            });
            if(unsubscribe && this._unsubscribe){
                this._unsubscribe();
            }
            this._unsubscribe = unsubscribe || null;
        }
        this.updateStatus();
        return true;
    }

    /**
     * @returns {boolean}
     */
    setupLoginWalletButton()
    {
        let button = this.getElement('#wallet-connect-button');
        let status = this.getElement('#wallet-connect-status');
        if(!button){
            let loginForm = this.getElement('#login-form');
            if(!loginForm){
                return false;
            }
            button = document.createElement('button');
            button.type = 'button';
            button.id = 'wallet-connect-button';
            button.className = 'wallet-connect-button';
            let wrapper = document.createElement('div');
            wrapper.className = 'input-box wallet-connect-box';
            status = document.createElement('div');
            status.id = 'wallet-connect-status';
            status.className = 'wallet-connect-status';
            wrapper.append(button, status);
            loginForm.appendChild(wrapper);
        }
        button.addEventListener('click', () => {
            this.handleConnectClick(button).catch((error) => {
                Logger.error('WalletLinkUI: wallet connect error.', error);
            });
        });
        this.loginStatusElement = status;
        this.loginButtonElement = button;
        return true;
    }

    /**
     * The register form gets its own connect button so a fresh account can
     * connect its wallet before starting the game. A distinct id is used to
     * avoid duplicating the login form ids in the same document.
     *
     * @returns {boolean}
     */
    setupRegisterWalletButton()
    {
        let registerForm = this.getElement('#register-form');
        if(!registerForm || this.getElement('#register-wallet-connect-button')){
            return false;
        }
        let button = document.createElement('button');
        button.type = 'button';
        button.id = 'register-wallet-connect-button';
        button.className = 'wallet-connect-button';
        button.textContent = this.t('wallet.connect');
        let status = document.createElement('div');
        status.id = 'register-wallet-connect-status';
        status.className = 'wallet-connect-status';
        let wrapper = document.createElement('div');
        wrapper.className = 'input-box wallet-connect-box';
        wrapper.append(button, status);
        registerForm.appendChild(wrapper);
        button.addEventListener('click', () => {
            this.handleConnectClick(button).catch((error) => {
                Logger.error('WalletLinkUI: wallet connect error.', error);
            });
        });
        return true;
    }

    /**
     * @returns {boolean}
     */
    isConnected()
    {
        return Boolean(this.connectedState?.isConnected || this.connectedState?.address);
    }

    /**
     * @returns {string|null}
     */
    getConnectedAddress()
    {
        return this.connectedState?.address || null;
    }

    /**
     * @returns {string}
     */
    shortAddress(address)
    {
        if(!address){
            return '';
        }
        if(address.length <= 12){
            return address;
        }
        return address.slice(0, 4)+'...'+address.slice(-4);
    }

    /**
     * Handle a click on any wallet connect button: connect the single available
     * wallet or render a small chooser when more than one is available.
     *
     * @param {HTMLElement} button
     * @returns {Promise<boolean>}
     */
    async handleConnectClick(button)
    {
        if(!this.walletManager){
            return false;
        }
        if(this.isConnected()){
            return true;
        }
        let wallets = this.walletManager.availableWallets();
        if(0 === wallets.length){
            this.setStatus(button, this.t('wallet.notSupported'));
            return false;
        }
        if(1 === wallets.length){
            return await this.connectWallet(button, wallets[0]);
        }
        this.renderWalletChooser(button, wallets);
        return true;
    }

    /**
     * @param {HTMLElement} button
     * @param {Array<Object>} wallets
     * @returns {boolean}
     */
    renderWalletChooser(button, wallets)
    {
        let status = this.statusElementFor(button);
        if(!status){
            return false;
        }
        status.innerHTML = '';
        let title = document.createElement('div');
        title.className = 'wallet-chooser-title';
        title.textContent = this.t('wallet.selectWallet');
        status.appendChild(title);
        let list = document.createElement('div');
        list.className = 'wallet-chooser';
        for(let wallet of wallets){
            let option = document.createElement('button');
            option.type = 'button';
            option.className = 'wallet-option';
            option.textContent = wallet.name;
            option.addEventListener('click', () => {
                this.connectWallet(button, wallet).catch((error) => {
                    Logger.error('WalletLinkUI: wallet connect error.', error);
                });
            });
            list.appendChild(option);
        }
        status.appendChild(list);
        return true;
    }

    /**
     * @param {HTMLElement} button
     * @returns {HTMLElement|null}
     */
    statusElementFor(button)
    {
        if(button && button.id === 'register-wallet-connect-button'){
            return this.getElement('#register-wallet-connect-status');
        }
        return this.getElement('#wallet-connect-status');
    }

    /**
     * @param {HTMLElement} button
     * @param {Object} wallet
     * @returns {Promise<boolean>}
     */
    async connectWallet(button, wallet)
    {
        if(!this.walletManager){
            return false;
        }
        this.setStatus(button, this.t('wallet.connecting'));
        try {
            await this.walletManager.connectWallet(wallet.id);
            return true;
        } catch (error) {
            let isCancelled = error && (
                'WalletSelectionCancelled' === error.name
                || 'WalletConnectionCancelled' === error.name
            );
            this.setStatus(button, isCancelled ? this.t('wallet.connect') : this.t('wallet.notSupported'));
            return false;
        }
    }

    /**
     * @param {HTMLElement} button
     * @param {string} message
     * @returns {boolean}
     */
    setStatus(button, message)
    {
        let status = this.statusElementFor(button);
        if(!status){
            return false;
        }
        status.textContent = message;
        return true;
    }

    /**
     * Refresh the button labels and status labels from the current wallet
     * connection state.
     *
     * @returns {boolean}
     */
    updateStatus()
    {
        if(!this.walletManager){
            return false;
        }
        this.connectedState = this.walletManager.currentState();
        let address = this.getConnectedAddress();
        let connectButton = this.getElement('#wallet-connect-button');
        if(connectButton){
            connectButton.textContent = address
                ? this.t('wallet.connected')+' ('+this.shortAddress(address)+')'
                : this.t('wallet.connect');
        }
        let registerButton = this.getElement('#register-wallet-connect-button');
        if(registerButton){
            registerButton.textContent = address
                ? this.t('wallet.connected')+' ('+this.shortAddress(address)+')'
                : this.t('wallet.connect');
        }
        let status = this.getElement('#wallet-connect-status');
        if(status){
            status.textContent = address ? this.t('wallet.willLinkAfterLogin') : '';
        }
        let registerStatus = this.getElement('#register-wallet-connect-status');
        if(registerStatus){
            registerStatus.textContent = address ? this.t('wallet.willLinkAfterLogin') : '';
        }
        this.storeAddress();
        return true;
    }

    /**
     * Keep the connected address available on the game manager user data for
     * the join options. The login room itself does not require it; the full
     * link flow runs after login (see requestLinkAfterLogin).
     *
     * @returns {boolean}
     */
    storeAddress()
    {
        if(!this.gameManager?.userData){
            return false;
        }
        this.gameManager.userData.walletAddress = this.getConnectedAddress() || '';
        return true;
    }

    /**
     * Reveal the in-game link area and render the "Link Wallet" button.
     *
     * @returns {boolean}
     */
    showLinkArea()
    {
        if(!this.canUseDom()){
            return false;
        }
        this.linkAreaElement = this.getElement('#wallet-link-area');
        if(!this.linkAreaElement){
            this.linkAreaElement = document.createElement('div');
            this.linkAreaElement.id = 'wallet-link-area';
            this.linkAreaElement.className = 'wallet-link-area';
            document.body.appendChild(this.linkAreaElement);
        }
        this.linkAreaElement.classList.remove('hidden');
        this.linkAreaElement.innerHTML = '';
        this.linkButtonElement = document.createElement('button');
        this.linkButtonElement.type = 'button';
        this.linkButtonElement.id = 'wallet-link-button';
        this.linkButtonElement.className = 'wallet-link-button';
        this.linkButtonElement.textContent = this.t('wallet.linkWallet');
        this.linkStatusElement = document.createElement('div');
        this.linkStatusElement.id = 'wallet-link-status';
        this.linkStatusElement.className = 'wallet-link-status';
        this.linkAreaElement.append(this.linkButtonElement, this.linkStatusElement);
        this.linkButtonElement.addEventListener('click', () => {
            this.requestLinkAfterLogin().catch((error) => {
                Logger.error('WalletLinkUI: wallet link request error.', error);
                this.setLinkStatus(this.t('wallet.linkFailed'));
            });
        });
        return true;
    }

    /**
     * @param {string} message
     * @returns {boolean}
     */
    setLinkStatus(message)
    {
        if(!this.linkStatusElement){
            return false;
        }
        this.linkStatusElement.textContent = message;
        return true;
    }

    /**
     * The logged account id used for the link challenge. The server never
     * sends the raw user model to the client, so the account id is derived
     * from the player data (user_id) present in the initial game data.
     *
     * @returns {number|boolean}
     */
    getAccountId()
    {
        let initialGameData = this.gameManager?.initialGameData || {};
        let user = initialGameData.user || false;
        if(user && user.id){
            return Number(user.id);
        }
        let player = initialGameData.player;
        if(player && player.user_id){
            return Number(player.user_id);
        }
        let players = initialGameData.players || [];
        if(0 < players.length && players[0]?.user_id){
            return Number(players[0].user_id);
        }
        return false;
    }

    /**
     * @param {string} path
     * @param {Object} data
     * @returns {Promise<Object|null>}
     */
    async post(path, data)
    {
        if('undefined' === typeof fetch){
            throw new Error('fetch is not available');
        }
        let base = (this.gameManager && this.gameManager.appServerUrl) ? this.gameManager.appServerUrl : '';
        let response = await fetch(base+path, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data || {})
        });
        let body = null;
        try {
            body = await response.json();
        } catch (error) {
            body = null;
        }
        if(!response.ok){
            throw new Error((body && body.message) || 'request failed with status '+response.status);
        }
        return body;
    }

    /**
     * Full link-after-login flow: request a challenge, sign it with the
     * connected wallet and submit the link. Requires the account to be logged
     * in and initial game data to be available.
     *
     * @returns {Promise<boolean>}
     */
    async requestLinkAfterLogin()
    {
        if(!this.walletManager){
            return false;
        }
        if(!this.isConnected()){
            let button = this.linkButtonElement || this.getElement('#wallet-connect-button');
            let connected = button
                ? await this.handleConnectClick(button)
                : await this.connectWalletFromChooser();
            if(!connected){
                return false;
            }
        }
        let accountId = this.getAccountId();
        if(!accountId){
            Logger.error('WalletLinkUI: account id not available for wallet link.');
            this.setLinkStatus(this.t('wallet.challengeFailed'));
            return false;
        }
        let walletAddress = this.getConnectedAddress();
        if(!walletAddress){
            this.setLinkStatus(this.t('wallet.linkFailed'));
            return false;
        }
        this.setLinkStatus(this.t('wallet.linking'));
        try {
            let challenge = await this.post('/api/blockchain/wallet/challenge', {
                accountId: accountId,
                walletAddress: walletAddress
            });
            if(!challenge || !challenge.message || !challenge.nonce){
                throw new Error('challenge response is invalid');
            }
            this.setLinkStatus(this.t('wallet.signed'));
            let signature = await this.walletManager.signMessageBase58(challenge.message);
            let result = await this.post('/api/blockchain/wallet/link', {
                accountId: accountId,
                walletAddress: walletAddress,
                walletSignature: signature,
                walletNonce: challenge.nonce
            });
            if(!result || true !== result.isSuccess){
                throw new Error((result && result.message) || 'wallet link failed');
            }
            this.setLinkStatus(this.t('wallet.linkSuccess'));
            if(typeof this.onLinkedCallback === 'function'){
                this.onLinkedCallback(result);
            }
            return true;
        } catch (error) {
            Logger.error('WalletLinkUI: wallet link error.', error);
            this.setLinkStatus(this.t('wallet.linkFailed'));
            return false;
        }
    }

    /**
     * Fallback connect helper used when no button element is available for the
     * pre-login connect flow.
     *
     * @returns {Promise<boolean>}
     */
    async connectWalletFromChooser()
    {
        if(!this.walletManager){
            return false;
        }
        let wallets = this.walletManager.availableWallets();
        if(0 === wallets.length){
            return false;
        }
        let wallet = wallets[0];
        if(1 < wallets.length && this.linkStatusElement){
            this.linkStatusElement.textContent = this.t('wallet.selectWallet');
        }
        return await this.connectWallet(null, wallet);
    }

}

module.exports.WalletLinkUI = WalletLinkUI;
