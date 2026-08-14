/**
 *
 * Reldens - Holder Tier Badge
 *
 * Small DOM badge shown in the game HUD when the logged account holds a wallet
 * with a token balance that qualifies for a holder tier. The tier is read from
 * the initial game data (walletHolder.tier), which the server attaches after
 * verifying the linked wallet balance on login.
 *
 * The tier keys mirror the server holder-tier ladder (lib/blockchain/server/
 * holder-tier.js). They are duplicated here on purpose: the client bundle must
 * not import server modules, so the ladder is a small local map.
 *
 * Browser-only: all DOM access is guarded with typeof window/document checks so
 * the module also requires cleanly under Node for tests.
 *
 */

const { sc } = require('@reldens/utils');

const TIER_KEYS = {
    1: 'ember',
    2: 'coinbearer',
    3: 'coppercrest',
    4: 'silverbound',
    5: 'gilded',
    6: 'vaultwarden',
    7: 'whale',
    8: 'leviathan',
    9: 'tidelord',
    10: 'stormcaller',
    11: 'krakencrown',
    12: 'titanforged',
    13: 'starhoard',
    14: 'voidwarden',
    15: 'realmshaper',
    16: 'worldforger',
    17: 'worldbearer',
    18: 'sovereign'
};

class HolderTierBadge
{

    /**
     * @param {Object} props
     * @param {import('../../game/client/game-manager').GameManager} [props.gameManager]
     * @param {import('@reldens/utils').EventsManager} [props.events]
     * @param {Object} [props.translator]
     */
    constructor(props)
    {
        /** @type {import('../../game/client/game-manager').GameManager|boolean} */
        this.gameManager = sc.get(props, 'gameManager', false);
        /** @type {import('@reldens/utils').EventsManager|boolean} */
        this.events = sc.get(props, 'events', false);
        /** @type {Object|boolean} */
        this.translator = sc.get(props, 'translator', this.gameManager?.services?.translator || false);
        /** @type {HTMLElement|null} */
        this.element = null;
        /** @type {number} */
        this.lastTier = 0;
        if(this.events){
            // startGameAfter fires right after login; initial game data may
            // arrive a tick later, so the badge also re-reads on
            // beforeCreateEngine, when the initial game data is guaranteed to
            // be present.
            this.events.on('reldens.startGameAfter', () => {
                this.update(this.readWalletHolder());
            });
            this.events.on('reldens.beforeCreateEngine', (initialGameData) => {
                this.update(initialGameData?.walletHolder || false);
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
     * @returns {HTMLElement|null}
     */
    getElement()
    {
        if(!this.canUseDom()){
            return null;
        }
        if(this.element){
            return this.element;
        }
        this.element = document.getElementById('holder-tier-badge');
        if(!this.element){
            this.element = document.createElement('div');
            this.element.id = 'holder-tier-badge';
            this.element.className = 'holder-tier-badge';
            document.body.appendChild(this.element);
        }
        return this.element;
    }

    /**
     * @returns {Object|boolean}
     */
    readWalletHolder()
    {
        return this.gameManager?.initialGameData?.walletHolder || false;
    }

    /**
     * @param {Object|boolean} tierData
     * @returns {boolean}
     */
    update(tierData)
    {
        let element = this.getElement();
        if(!element){
            return false;
        }
        let tier = Number(sc.get(tierData, 'tier', 0));
        if(!Number.isFinite(tier) || tier < 1){
            this.lastTier = 0;
            element.classList.add('hidden');
            element.textContent = '';
            return false;
        }
        this.lastTier = tier;
        let tierKey = TIER_KEYS[tier] || ('tier-'+tier);
        let tierLabel = this.translate('blockchain.tier.'+tierKey);
        let title = this.translate('blockchain.tier.title');
        element.textContent = (title && tierLabel) ? title+': '+tierLabel : tierLabel;
        element.classList.remove('hidden');
        return true;
    }

    /**
     * @param {string} key
     * @returns {string}
     */
    translate(key)
    {
        let translator = this.getTranslator();
        if(translator && typeof translator.t === 'function'){
            return translator.t(key);
        }
        return key;
    }

}

module.exports.HolderTierBadge = HolderTierBadge;
