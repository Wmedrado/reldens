/**
 *
 * Reldens - Translations - en_US
 *
 * Blockchain client UI strings: wallet connect, link-after-login flow and
 * holder tier labels. Loaded through TranslationsMapper into the
 * "blockchain" snippet namespace.
 *
 */

const BlockchainSnippets = {
    blockchain: {
        wallet: {
            connect: 'Connect Wallet',
            disconnect: 'Disconnect Wallet',
            connected: 'Wallet connected',
            connecting: 'Connecting wallet...',
            selectWallet: 'Select a wallet',
            notSupported: 'No compatible wallet found in this browser.',
            connectedAddress: 'Wallet connected: %address',
            willLinkAfterLogin: 'Wallet will be linked after login.',
            requiredForLogin: 'A wallet is required to log in.',
            linkWallet: 'Link Wallet',
            linking: 'Linking wallet...',
            signed: 'Wallet signed, sending link request...',
            linkSuccess: 'Wallet linked successfully.',
            linkFailed: 'Wallet link failed. Please try again.',
            signRejected: 'Wallet signature was rejected.',
            challengeFailed: 'Could not obtain a wallet challenge.'
        },
        tier: {
            title: 'Holder',
            ember: 'Ember',
            coinbearer: 'Coinbearer',
            coppercrest: 'Coppercrest',
            silverbound: 'Silverbound',
            gilded: 'Gilded',
            vaultwarden: 'Vaultwarden',
            whale: 'Whale',
            leviathan: 'Leviathan',
            tidelord: 'Tidelord',
            stormcaller: 'Stormcaller',
            krakencrown: 'Krakencrown',
            titanforged: 'Titanforged',
            starhoard: 'Starhoard',
            voidwarden: 'Voidwarden',
            realmshaper: 'Realmshaper',
            worldforger: 'Worldforger',
            worldbearer: 'Worldbearer',
            sovereign: 'Sovereign'
        }
    }
};

module.exports.BlockchainSnippets = BlockchainSnippets;
