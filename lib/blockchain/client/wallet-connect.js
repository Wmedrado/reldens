/**
 *
 * Reldens - Wallet Connect Client
 *
 * Reown AppKit transport for external Solana wallet apps. The dedicated Solana
 * adapter and Solana Web3 are loaded only after the "Wallet app / QR" option
 * is selected, so normal game boot does not download AppKit or Solana Web3.
 * The server challenge remains authoritative for account linking; this module
 * only supplies a temporary signing connection.
 *
 * Everything here is gated behind RELDENS_REOWN_PROJECT_ID (injected via
 * setWalletConnectProjectId). Without it connect() returns null and
 * signMessageBase58() throws. This file is CLIENT-only: window access is
 * guarded so the module also requires cleanly under Node for tests.
 *
 */

const bs58 = require('bs58');

const WALLET_CONNECT_ID = 'reldens.walletconnect';
const WALLET_CONNECT_NAME = 'Wallet app / QR code';
const WALLET_CONNECT_ICON =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="14" fill="%233b82f6"/%3E%3Cpath d="M18 27c8-8 20-8 28 0l3 3-5 5-3-3c-5-5-13-5-18 0l-3 3-5-5 3-3Zm5 10 5-5 4 4 4-4 5 5-9 9-9-9Z" fill="white"/%3E%3C/svg%3E';

const FEATURED_WALLET_IDS = Object.freeze([
    // Phantom, Solflare, Backpack:
    'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393',
    '1ca0bdd4747578705b1939af023d120677c64fe6ca76add81fda36e350605e79',
    '2bd8c14e035c2d48f184aaa168559e86b0e3433228d3c4075900a221785019b0'
]);

let projectId = null;

/**
 * @param {string|null} id
 */
function setWalletConnectProjectId(id)
{
    projectId = typeof id === 'string' && id.trim() !== '' ? id.trim() : null;
}

/**
 * @returns {boolean}
 */
function walletConnectConfigured()
{
    return null !== projectId;
}

function metadataUrl()
{
    if(typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)){
        return window.location.origin;
    }
    return 'https://reldens.com';
}

function base64ToBytes(encoded)
{
    if(typeof globalThis.atob !== 'function'){
        throw new Error('atob is not available in this environment');
    }
    let bin = globalThis.atob(encoded);
    let out = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++){
        out[i] = bin.charCodeAt(i);
    }
    return out;
}

/**
 * Pure: extract the connected Solana address from the AppKit account state.
 * Only @reown/appkit's account shape is touched; @solana/web3.js stays lazy.
 *
 * @param {Object|null|undefined} account
 * @param {string|null|undefined} chain
 * @returns {{address: string|null, chain: string|null}}
 */
function parseAppKitAccountState(account, chain)
{
    if(!account || account.isConnected !== true){
        return {address: null, chain: null};
    }
    let allAccounts = account.allAccounts;
    let address = Array.isArray(allAccounts)
        ? (allAccounts.find((candidate) => candidate?.namespace === 'solana' && !!candidate.address)?.address ?? null)
        : null;
    if(!address || typeof chain !== 'string' || !chain.startsWith('solana:')){
        return {address: null, chain: null};
    }
    return {address: address, chain: chain};
}

/**
 * @param {string} transactionBase64
 * @returns {Promise<Object>} a @solana/web3.js Transaction or VersionedTransaction
 */
async function deserializeSolanaTransaction(transactionBase64)
{
    // Loaded here, not at module scope, so this file requires cleanly in Node
    // and normal boot never pulls Solana Web3 into the bundle.
    let { Transaction, VersionedTransaction } = await import('@solana/web3.js');
    let bytes = base64ToBytes(transactionBase64);
    let versioned = VersionedTransaction.deserialize(bytes);
    return versioned.version === 'legacy' ? Transaction.from(bytes) : versioned;
}

function connectionCancelled()
{
    let error = new Error('wallet connection cancelled');
    error.name = 'WalletConnectionCancelled';
    return error;
}

/**
 * Lazy-load AppKit and build a connectable client bound to `projectId`.
 *
 * @param {string} appKitProjectId
 * @returns {Promise<Object>}
 */
async function createWalletConnectClient(appKitProjectId)
{
    let [{ createAppKit }, { SolanaAdapter }, { solana }] = await Promise.all([
        import('@reown/appkit'),
        import('@reown/appkit-adapter-solana'),
        import('@reown/appkit/networks')
    ]);
    let protocol = typeof window === 'undefined' ? '' : window.location.protocol;
    let packagedDesktop = protocol === 'app:';
    let adapter = new SolanaAdapter({registerWalletStandard: false});
    let appKit = createAppKit({
        adapters: [adapter],
        projectId: appKitProjectId,
        networks: [solana],
        defaultNetwork: solana,
        metadata: {
            name: 'Reldens',
            description: 'Connect a Solana wallet to Reldens',
            url: metadataUrl(),
            icons: []
        },
        featuredWalletIds: [...FEATURED_WALLET_IDS],
        // Electron cannot see extensions in the normal browser profile: open its
        // cross-device QR pairing route directly instead.
        modalView: packagedDesktop ? 'ConnectingWalletConnectBasic' : 'Connect',
        allWallets: packagedDesktop ? 'HIDE' : 'SHOW',
        enableNetworkSwitch: false,
        enableWalletGuide: !packagedDesktop,
        enableMobileFullScreen: true,
        experimental_preferUniversalLinks: true,
        themeMode: 'dark',
        features: {
            analytics: false,
            email: false,
            socials: false,
            swaps: false,
            onramp: false
        }
    });

    let listeners = new Set();
    let readState = () => parseAppKitAccountState(
        appKit.getAccount('solana'),
        appKit.getCaipNetwork('solana')?.caipNetworkId
    );
    let state = readState();
    let emit = () => {
        let next = readState();
        if(next.address === state.address && next.chain === state.chain){
            return;
        }
        state = next;
        for(let listener of listeners){
            listener(state);
        }
    };
    let accountOff = appKit.subscribeAccount(emit, 'solana');
    let networkOff = appKit.subscribeNetwork(emit);

    function requireProvider()
    {
        if(!state.address){
            throw new Error('connect a wallet first');
        }
        let provider = appKit.getProvider('solana');
        if(!provider){
            throw new Error('connected Solana wallet provider is unavailable');
        }
        return provider;
    }

    return {
        current: () => state,
        refresh: () => {
            emit();
            return state;
        },
        async connect()
        {
            let existing = readState();
            if(existing.address && existing.chain){
                state = existing;
                return state;
            }
            let settled = false;
            let modalOpened = false;
            let finish = () => {};
            let cancel = () => {};
            let connected = new Promise((resolve, reject) => {
                let timeout = globalThis.setTimeout(() => {
                    cancel(new Error('wallet connection timed out'));
                }, 120000);
                let accountOffLocal = appKit.subscribeAccount(() => {
                    emit();
                    if(state.address && state.chain){
                        finish(state);
                    }
                }, 'solana');
                let networkOffLocal = appKit.subscribeNetwork(() => {
                    emit();
                    if(state.address && state.chain){
                        finish(state);
                    }
                });
                let stateOff = appKit.subscribeState((next) => {
                    if(next.open){
                        modalOpened = true;
                    } else if(modalOpened && !state.address){
                        cancel();
                    }
                });
                let cleanup = () => {
                    globalThis.clearTimeout(timeout);
                    accountOffLocal();
                    networkOffLocal();
                    stateOff();
                };
                finish = (result) => {
                    if(settled){
                        return;
                    }
                    settled = true;
                    cleanup();
                    resolve(result);
                };
                cancel = (error) => {
                    if(settled){
                        return;
                    }
                    settled = true;
                    cleanup();
                    reject(error ?? connectionCancelled());
                };
            });
            try {
                await appKit.open({view: packagedDesktop ? 'ConnectingWalletConnectBasic' : 'Connect', namespace: 'solana'});
                if(appKit.isOpen()){
                    modalOpened = true;
                }
                emit();
                if(state.address && state.chain){
                    finish(state);
                }
            } catch (error) {
                cancel(error);
            }
            try {
                return await connected;
            } catch (error) {
                await appKit.disconnect('solana').catch(() => {});
                throw error;
            }
        },
        async disconnect()
        {
            await appKit.disconnect('solana');
            state = {address: null, chain: null};
            for(let listener of listeners){
                listener(state);
            }
        },
        async signMessageBase58(message)
        {
            let signature = await requireProvider().signMessage(new TextEncoder().encode(message));
            if(!(signature instanceof Uint8Array) || signature.byteLength === 0){
                throw new Error('wallet message signing returned an invalid signature');
            }
            return bs58.encode(signature);
        },
        async signAndSendTransactionBase64(transactionBase64)
        {
            let transaction = await deserializeSolanaTransaction(transactionBase64);
            let signature = await requireProvider().signAndSendTransaction(
                transaction,
                {preflightCommitment: 'confirmed'}
            );
            if(typeof signature !== 'string' || signature.length === 0){
                throw new Error('wallet transaction signing returned an invalid signature');
            }
            return signature;
        },
        onChange(listener)
        {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
}

module.exports.WALLET_CONNECT_ID = WALLET_CONNECT_ID;
module.exports.WALLET_CONNECT_NAME = WALLET_CONNECT_NAME;
module.exports.WALLET_CONNECT_ICON = WALLET_CONNECT_ICON;
module.exports.FEATURED_WALLET_IDS = FEATURED_WALLET_IDS;
module.exports.setWalletConnectProjectId = setWalletConnectProjectId;
module.exports.walletConnectConfigured = walletConnectConfigured;
module.exports.parseAppKitAccountState = parseAppKitAccountState;
module.exports.deserializeSolanaTransaction = deserializeSolanaTransaction;
module.exports.createWalletConnectClient = createWalletConnectClient;
