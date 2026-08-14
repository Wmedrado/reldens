/**
 *
 * Reldens - NFT Binding Service
 *
 * Bridges in-game items and on-chain NFTs. When an item that has an NFT
 * mapping is pushed through an exchange (traded, sold, dropped) a binding
 * operation is recorded in the blockchain_nft_ops table. The actual on-chain
 * mint/burn call is a stub (performOnChainOp) to be wired to the
 * economy-service / tx builder later; this server stays read-only otherwise.
 *
 */

const { Logger, sc } = require('@reldens/utils');
const { ItemsEvents } = require('@reldens/items-system');
const { BlockchainConst } = require('../constants');

/**
 * @typedef {import('@reldens/storage').BaseDataServer} BaseDataServer
 * @typedef {import('@reldens/storage').BaseDriver} BaseDriver
 */
class NftBindingService
{

    /**
     * @param {Object} props
     * @param {BaseDataServer} [props.dataServer]
     * @param {Object} [props.config]
     * @param {Object} [props.events]
     */
    constructor(props)
    {
        /** @type {BaseDataServer|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
        /** @type {Object|boolean} */
        this.config = sc.get(props, 'config', false);
        /** @type {Object|boolean} */
        this.events = sc.get(props, 'events', false);
        /** @type {Object} */
        this.itemKeyToNft = this.config?.getWithoutLogs?.('server/blockchain/nft/itemKeyToNft', {}) || {};
        /** @type {boolean} */
        this.isEnabled = Boolean(this.config?.getWithoutLogs?.('server/blockchain/nft/enabled', false));
        /** @type {BaseDriver|boolean} */
        this.opsRepository = this.dataServer?.getEntity('blockchain_nft_ops') || false;
    }

    /**
     * Hook the exchange FINALIZED event. Exchange platforms default to the
     * shared EventsManagerSingleton, so a single hook covers the default flow;
     * custom platforms can be wired per-instance with register().
     *
     * @returns {boolean}
     */
    listenEvents()
    {
        if(!this.events){
            return false;
        }
        this.events.on(ItemsEvents.EXCHANGE.FINALIZED, createNftExchangeListener(this));
        return true;
    }

    /**
     * Attach the finalize listener to a single exchange platform events
     * object (for platforms created with a custom eventsManager).
     *
     * @param {Object} exchangePlatform
     * @returns {boolean}
     */
    register(exchangePlatform)
    {
        let platformEvents = sc.get(exchangePlatform, 'events', false);
        if(!platformEvents){
            return false;
        }
        platformEvents.on(ItemsEvents.EXCHANGE.FINALIZED, createNftExchangeListener(this));
        return true;
    }

    /**
     * Read both sides of a finalized exchange and record a binding op for
     * every pushed item that has an NFT mapping.
     *
     * @param {Object} exchangePlatform
     * @returns {Promise<boolean>}
     */
    async onExchangeFinalized(exchangePlatform)
    {
        if(!this.isEnabled || !this.opsRepository){
            return false;
        }
        let pushedItems = this.collectPushedItems(exchangePlatform);
        for(let pushedItem of pushedItems){
            let nft = sc.get(this.itemKeyToNft, pushedItem.itemKey, false);
            if(!nft){
                continue;
            }
            let opRow = {
                user_id: pushedItem.userId,
                item_key: pushedItem.itemKey,
                mint: sc.get(nft, 'mint', ''),
                op: BlockchainConst.NFT_OP_BIND,
                status: BlockchainConst.NFT_OP_STATUS_PENDING,
                created_at: new Date()
            };
            let createResult = await this.opsRepository.create(opRow);
            if(!createResult){
                Logger.error('NftBindingService: failed to record binding op.', opRow);
                continue;
            }
            await this.performOnChainOp(Object.assign({}, opRow, {id: createResult.id}));
            Logger.info('NftBindingService: binding op recorded.', {itemKey: pushedItem.itemKey, mint: opRow.mint});
        }
        return true;
    }

    /**
     * Resolve {itemKey, userId, side} tuples for every pushed item on both
     * sides of the exchange.
     *
     * @param {Object} exchangePlatform
     * @returns {Array<Object>}
     */
    collectPushedItems(exchangePlatform)
    {
        let pushedItems = [];
        let inventories = sc.get(exchangePlatform, 'inventories', {}) || {};
        let exchangeBetween = sc.get(exchangePlatform, 'exchangeBetween', {}) || {};
        for(let side of ['A', 'B']){
            let sideExchange = sc.get(exchangeBetween, side, {}) || {};
            let inventory = sc.get(inventories, side, null);
            for(let itemUid of Object.keys(sideExchange)){
                let item = inventory?.items?.[itemUid] || false;
                let userId = 'function' === typeof inventory?.getOwnerId ? inventory.getOwnerId() : 0;
                pushedItems.push({
                    itemKey: item?.key || itemUid,
                    userId: userId,
                    side: side
                });
            }
        }
        return pushedItems;
    }

    /**
     * Stub for the actual on-chain mint/burn operation. Wire this to the
     * economy-service / tx builder later; the chain connection must stay
     * read-only until then.
     *
     * @param {Object} op
     * @returns {Promise<boolean>}
     */
    async performOnChainOp(op)
    {
        Logger.info('NftBindingService: performOnChainOp stub (on-chain mint/burn not wired).', {op});
        return true;
    }

}

/**
 * Factory for the exchange finalize listener bound to a service instance.
 *
 * @param {NftBindingService} service
 * @returns {Function}
 */
function createNftExchangeListener(service)
{
    return async (payload) => {
        if(!payload?.exchangePlatform){
            return false;
        }
        return await service.onExchangeFinalized(payload.exchangePlatform);
    };
}

module.exports.NftBindingService = NftBindingService;
module.exports.createNftExchangeListener = createNftExchangeListener;
