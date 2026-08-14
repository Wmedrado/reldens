/**
 *
 * Reldens - Client Wallet Manager
 *
 * Non-custodial Solana wallet connection through Wallet Standard (v1
 * extension wallets only). The account-to-wallet link itself is performed by
 * the server after the wallet signs a challenge (see server plugin).
 *
 */

const { isSolanaChain } = require('@solana/wallet-standard-chains');
const { SolanaSignMessage } = require('@solana/wallet-standard-features');
const { getWallets } = require('@wallet-standard/app');
const { StandardConnect, StandardDisconnect, StandardEvents } = require('@wallet-standard/features');
const bs58 = require('bs58');
const {
    WALLET_CONNECT_ID,
    WALLET_CONNECT_NAME,
    WALLET_CONNECT_ICON,
    setWalletConnectProjectId
} = require('./wallet-connect');

class WalletSelectionCancelled extends Error
{

    constructor()
    {
        super('wallet selection cancelled');
        this.name = 'WalletSelectionCancelled';
    }

}

const SELECTED_WALLET_KEY = 'reldens.wallet.standard.selectedWallet';

class ClientWalletManager
{

    constructor()
    {
        this.listeners = new Set();
        this.registry = null;
        this.initialized = false;
        this.selectedWallet = null;
        this.selectedAccount = null;
        this.selectedWalletEventsOff = null;
        this.registryOff = null;
        this.registryUnregisterOff = null;
        this.walletConnectClient = null;
        this.walletConnectSelected = false;
        this.walletConnectProjectId = null;
    }

    /**
     * @returns {boolean}
     */
    canUseStorage()
    {
        return 'undefined' !== typeof window && Boolean(window.localStorage);
    }

    /**
     * @returns {string|null}
     */
    readStoredWalletName()
    {
        if(!this.canUseStorage()){
            return null;
        }
        try {
            return window.localStorage.getItem(SELECTED_WALLET_KEY);
        } catch (error) {
            return null;
        }
    }

    /**
     * @param {string|null} name
     */
    writeStoredWalletName(name)
    {
        if(!this.canUseStorage()){
            return;
        }
        try {
            if(name){
                window.localStorage.setItem(SELECTED_WALLET_KEY, name);
            } else {
                window.localStorage.removeItem(SELECTED_WALLET_KEY);
            }
        } catch (error) {
            // Storage can be disabled in private browsing. Wallet state still
            // works for the current page; it just will not silently reconnect.
        }
    }

    /**
     * @param {Object} wallet
     * @returns {boolean}
     */
    hasConnectFeature(wallet)
    {
        return StandardConnect in wallet.features;
    }

    /**
     * @param {Object} wallet
     * @returns {boolean}
     */
    hasDisconnectFeature(wallet)
    {
        return StandardDisconnect in wallet.features;
    }

    /**
     * @param {Object} wallet
     * @returns {boolean}
     */
    hasEventsFeature(wallet)
    {
        return StandardEvents in wallet.features;
    }

    /**
     * @param {Object} wallet
     * @returns {boolean}
     */
    hasSignMessageFeature(wallet)
    {
        return SolanaSignMessage in wallet.features;
    }

    /**
     * @param {Object} account
     * @returns {boolean}
     */
    accountSupportsSolanaSignMessage(account)
    {
        return account.chains.some(isSolanaChain) && account.features.includes(SolanaSignMessage);
    }

    /**
     * @param {Object} wallet
     * @returns {boolean}
     */
    walletSupportsSolana(wallet)
    {
        return (
            wallet.chains.some(isSolanaChain)
            || wallet.accounts.some((account) => account.chains.some(isSolanaChain))
        );
    }

    /**
     * @param {Object} wallet
     * @returns {boolean}
     */
    isCompatibleWallet(wallet)
    {
        return this.hasConnectFeature(wallet)
            && this.hasSignMessageFeature(wallet)
            && this.walletSupportsSolana(wallet);
    }

    /**
     * @returns {Array<Object>}
     */
    compatibleWallets()
    {
        this.initWallet();
        return this.registry?.get().filter((wallet) => this.isCompatibleWallet(wallet)) ?? [];
    }

    /**
     * @param {Object} wallet
     * @param {Array<Object>} [accounts]
     * @returns {Object|null}
     */
    chooseAccount(wallet, accounts = wallet.accounts)
    {
        return accounts.find((account) => this.accountSupportsSolanaSignMessage(account)) ?? null;
    }

    /**
     * @returns {Object}
     */
    currentState()
    {
        if(this.walletConnectSelected && this.walletConnectClient){
            let address = this.walletConnectClient.current().address;
            if(address){
                return {address: address, isConnected: true};
            }
        }
        let address = this.selectedAccount?.address ?? null;
        return {address: address, isConnected: null !== address};
    }

    /**
     * @returns {Object}
     */
    getConnectedAddress()
    {
        return this.currentState().address;
    }

    /**
     * Subscribe to connection changes. Fires on connect/disconnect/account
     * switch. Returns the unsubscribe function.
     *
     * @param {Function} listener
     * @returns {Function}
     */
    subscribe(listener)
    {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * @param {Object|null} wallet
     * @param {Object|null} account
     * @param {boolean} persist
     */
    setSelected(wallet, account, persist)
    {
        let previousAddress = this.currentState().address;
        this.selectedWallet = wallet;
        this.selectedAccount = account;
        if(persist){
            this.writeStoredWalletName(wallet?.name ?? null);
        }
        let nextAddress = this.selectedAccount?.address ?? null;
        if(previousAddress !== nextAddress){
            this.emitWalletState();
        }
    }

    emitWalletState()
    {
        let state = this.currentState();
        for(let callback of this.listeners){
            callback(state);
        }
    }

    detachSelectedWalletEvents()
    {
        if(!this.selectedWalletEventsOff){
            return;
        }
        this.selectedWalletEventsOff();
        this.selectedWalletEventsOff = null;
    }

    /**
     * @param {Object} wallet
     */
    attachSelectedWalletEvents(wallet)
    {
        this.detachSelectedWalletEvents();
        if(!this.hasEventsFeature(wallet)){
            return;
        }
        let events = wallet.features[StandardEvents];
        this.selectedWalletEventsOff = events.on('change', (props) => {
            if(wallet !== this.selectedWallet){
                return;
            }
            if(props.accounts){
                this.setSelected(wallet, this.chooseAccount(wallet, props.accounts), true);
                return;
            }
            this.setSelected(wallet, this.chooseAccount(wallet), true);
        });
    }

    /**
     * @param {Object} wallet
     * @param {string} wallet.name
     * @returns {Object}
     */
    walletOption(wallet)
    {
        return {
            id: wallet.name,
            name: wallet.name,
            icon: wallet.icon,
            connected: this.selectedWallet === wallet && null !== this.selectedAccount
        };
    }

    /**
     * @returns {Array<Object>}
     */
    availableWallets()
    {
        let options = this.compatibleWallets().map((wallet) => this.walletOption(wallet));
        if(this.walletConnectConfigured()){
            options.push({
                id: WALLET_CONNECT_ID,
                name: WALLET_CONNECT_NAME,
                icon: WALLET_CONNECT_ICON,
                connected: this.walletConnectSelected && null !== this.getWalletConnectAddress()
            });
        }
        return options;
    }

    /**
     * @param {string} id
     * @returns {Object|null}
     */
    findWallet(id)
    {
        return this.compatibleWallets().find((wallet) => wallet.name === id) ?? null;
    }

    /**
     * @returns {boolean}
     */
    selectAuthorizedWallet()
    {
        let storedName = this.readStoredWalletName();
        let wallets = this.compatibleWallets();
        let storedWallet = storedName
            ? (wallets.find((wallet) => wallet.name === storedName) ?? null)
            : null;
        let walletWithAccount = storedWallet
            ?? wallets.find((wallet) => null !== this.chooseAccount(wallet))
            ?? null;
        if(!walletWithAccount){
            return false;
        }
        let account = this.chooseAccount(walletWithAccount);
        this.attachSelectedWalletEvents(walletWithAccount);
        this.setSelected(walletWithAccount, account, null !== account);
        return null !== account;
    }

    trySilentReconnect()
    {
        let storedName = this.readStoredWalletName();
        if(!storedName){
            this.selectAuthorizedWallet();
            return;
        }
        let wallet = this.compatibleWallets().find((candidate) => candidate.name === storedName) ?? null;
        if(!wallet){
            return;
        }
        this.attachSelectedWalletEvents(wallet);
        let existing = this.chooseAccount(wallet);
        if(existing){
            this.setSelected(wallet, existing, true);
            return;
        }
        this.selectedWallet = wallet;
        wallet.features[StandardConnect]
            .connect({silent: true})
            .then((result) => {
                if(this.selectedWallet !== wallet){
                    return;
                }
                this.setSelected(wallet, this.chooseAccount(wallet, result.accounts), true);
            })
            .catch(() => {
                if(this.selectedWallet === wallet){
                    this.setSelected(wallet, null, false);
                }
            });
    }

    attachRegistryEvents()
    {
        if(!this.registry || this.registryOff || this.registryUnregisterOff){
            return;
        }
        this.registryOff = this.registry.on('register', (...wallets) => {
            let currentId = this.selectedWallet ? this.selectedWallet.name : null;
            if(
                currentId
                && wallets.some((wallet) => wallet.name === currentId && this.isCompatibleWallet(wallet))
            ){
                this.trySilentReconnect();
            } else if(!this.selectedAccount) {
                this.selectAuthorizedWallet();
            }
        });
        this.registryUnregisterOff = this.registry.on('unregister', (...wallets) => {
            if(!this.selectedWallet || !wallets.includes(this.selectedWallet)){
                return;
            }
            this.detachSelectedWalletEvents();
            this.setSelected(null, null, false);
        });
    }

    /**
     * Initialize the registry and attempt a silent reconnect of the stored
     * wallet.
     *
     * @returns {Object}
     */
    initWallet()
    {
        if(this.initialized && this.registry){
            return this.registry;
        }
        this.initialized = true;
        this.registry = getWallets();
        this.attachRegistryEvents();
        this.trySilentReconnect();
        return this.registry;
    }

    /**
     * Connect a wallet by name. Throws WalletSelectionCancelled on a cancelled
     * selection.
     *
     * @param {string} walletId
     * @returns {Promise<Object>}
     */
    async connectWallet(walletId)
    {
        if(walletId === WALLET_CONNECT_ID){
            return this.walletConnectConnect();
        }
        let wallet = this.findWallet(walletId);
        if(!wallet){
            throw new Error('wallet is not available');
        }
        this.attachSelectedWalletEvents(wallet);
        let result = await wallet.features[StandardConnect].connect();
        let account = this.chooseAccount(wallet, result.accounts);
        if(!account){
            throw new Error('wallet did not authorize a Solana account with message signing');
        }
        this.setSelected(wallet, account, true);
        return this.currentState();
    }

    /**
     * Disconnect the selected wallet, if any.
     *
     * @returns {Promise<void>}
     */
    async disconnect()
    {
        if(this.walletConnectSelected && this.walletConnectClient){
            this.walletConnectSelected = false;
            await this.walletConnectClient.disconnect();
            this.walletConnectClient = null;
            this.emitWalletState();
            return;
        }
        let wallet = this.selectedWallet;
        this.detachSelectedWalletEvents();
        this.setSelected(null, null, true);
        if(wallet && this.hasDisconnectFeature(wallet)){
            await wallet.features[StandardDisconnect].disconnect();
        }
    }

    bytesEqual(first, second)
    {
        if(first.byteLength !== second.byteLength){
            return false;
        }
        for(let i = 0; i < first.byteLength; i++){
            if(first[i] !== second[i]){
                return false;
            }
        }
        return true;
    }

    /**
     * Ask the connected wallet to sign `message` and return the signature
     * base58-encoded (the encoding the server's verifier expects).
     *
     * @param {string} message
     * @returns {Promise<string>}
     */
    async signMessageBase58(message)
    {
        if(this.walletConnectSelected && this.walletConnectClient){
            return this.walletConnectClient.signMessageBase58(message);
        }
        let wallet = this.selectedWallet;
        let account = this.selectedAccount;
        if(!wallet || !account){
            throw new Error('connect a wallet first');
        }
        let messageBytes = new TextEncoder().encode(message);
        let results = await wallet.features[SolanaSignMessage].signMessage({
            account: account,
            message: messageBytes
        });
        let result = results[0];
        if(!result || !(result.signature instanceof Uint8Array)){
            throw new Error('wallet returned an invalid signature');
        }
        if(!this.bytesEqual(result.signedMessage, messageBytes)){
            throw new Error('wallet modified the message before signing');
        }
        return bs58.encode(result.signature);
    }

    /**
     * @returns {boolean}
     */
    walletConnectConfigured()
    {
        return null !== this.walletConnectProjectId;
    }

    /**
     * @param {string|null} projectId
     */
    setWalletConnectProjectId(projectId)
    {
        this.walletConnectProjectId = (projectId && String(projectId).trim() !== '') ? String(projectId).trim() : null;
        setWalletConnectProjectId(this.walletConnectProjectId);
    }

    /**
     * @returns {string|null}
     */
    getWalletConnectAddress()
    {
        return this.walletConnectClient?.current().address ?? null;
    }

    /**
     * Load the wallet-connect transport lazily and open the wallet app / QR
     * flow. The module is dynamic-imported so normal boot never bundles AppKit
     * or Solana Web3.
     *
     * @returns {Promise<Object>}
     */
    async walletConnectConnect()
    {
        if(!this.walletConnectConfigured()){
            throw new Error('wallet connect is not configured');
        }
        if(this.walletConnectSelected && this.walletConnectClient){
            return this.currentState();
        }
        let { createWalletConnectClient } = await import('./wallet-connect');
        if(!this.walletConnectClient){
            this.walletConnectClient = await createWalletConnectClient(this.walletConnectProjectId);
            this.walletConnectClient.onChange((next) => {
                this.emitWalletState();
                if(!next.address){
                    this.walletConnectSelected = false;
                    this.walletConnectClient = null;
                    this.emitWalletState();
                }
            });
        }
        await this.walletConnectClient.connect();
        if(!this.walletConnectClient.current().address){
            throw new Error('wallet connection did not authorize an address');
        }
        this.walletConnectSelected = true;
        this.emitWalletState();
        return this.currentState();
    }

}

module.exports.ClientWalletManager = ClientWalletManager;
module.exports.WalletSelectionCancelled = WalletSelectionCancelled;
module.exports.SELECTED_WALLET_KEY = SELECTED_WALLET_KEY;
