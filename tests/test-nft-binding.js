/**
 *
 * Reldens - test-nft-binding
 *
 * Standalone tests for the NFT <-> item binding bridge. Uses a fake exchange
 * platform (both sides, exchangeBetween maps, per-platform events) and an
 * in-memory fake repository, so no database is needed.
 *
 */

const assert = require('assert');
const { NftBindingService, createNftExchangeListener } = require('../lib/blockchain/server/nft-binding');
const { ItemsEvents } = require('@reldens/items-system');

function createFakeRepo()
{
    let rows = [];
    let nextId = 1;
    return {
        rows,
        async create(params)
        {
            let row = Object.assign({id: nextId++}, params);
            rows.push(row);
            return row;
        },
        async loadAll()
        {
            return rows;
        },
        async loadOneBy(field, value)
        {
            return rows.find((currentRow) => currentRow[field] === value) || null;
        },
        async updateById(id, params)
        {
            let row = rows.find((currentRow) => currentRow.id === id);
            if(row){
                Object.assign(row, params);
            }
            return row;
        },
        async deleteById(id)
        {
            rows = rows.filter((currentRow) => currentRow.id !== id);
            return true;
        }
    };
}

function createFakeDataServer(repos)
{
    return {
        getEntity(name)
        {
            return repos[name] || createFakeRepo();
        }
    };
}

function createFakeExchangePlatform()
{
    let handlers = {};
    let platform = {
        inventories: {
            A: {items: {}, getOwnerId(){ return 1; }},
            B: {items: {}, getOwnerId(){ return 2; }}
        },
        exchangeBetween: {A: {}, B: {}},
        events: {
            on(type, fn)
            {
                (handlers[type] = handlers[type] || []).push(fn);
            },
            async emit(type, payload)
            {
                let listeners = handlers[type] || [];
                for(let fn of listeners){
                    await fn(payload);
                }
            }
        }
    };
    platform._handlers = handlers;
    return platform;
}

function makeService(configValues, repos)
{
    let config = {
        getWithoutLogs(key, defaultValue)
        {
            return undefined !== configValues[key] ? configValues[key] : defaultValue;
        }
    };
    return new NftBindingService({
        dataServer: createFakeDataServer(repos || {blockchain_nft_ops: createFakeRepo()}),
        config: config
    });
}

function pushItem(platform, side, itemUid, itemKey, qty)
{
    platform.inventories[side].items[itemUid] = {key: itemKey, qty};
    platform.exchangeBetween[side][itemUid] = qty;
}

async function main()
{
    // No NFT mapping -> no op rows.
    let platform = createFakeExchangePlatform();
    pushItem(platform, 'A', 'potion-1', 'potion', 5);
    let service = makeService({'server/blockchain/nft/enabled': true, 'server/blockchain/nft/itemKeyToNft': {}});
    await service.onExchangeFinalized(platform);
    let repo = service.opsRepository;
    assert.strictEqual(repo.rows.length, 0);

    // Pushed item with mapping -> binding op recorded (bind/pending).
    platform = createFakeExchangePlatform();
    pushItem(platform, 'A', 'sword-1', 'sword', 1);
    pushItem(platform, 'B', 'shield-1', 'shield', 1);
    service = makeService({'server/blockchain/nft/enabled': true, 'server/blockchain/nft/itemKeyToNft': {
        sword: {mint: 'MINT_SWORD'},
        shield: {mint: 'MINT_SHIELD'}
    }});
    await service.onExchangeFinalized(platform);
    repo = service.opsRepository;
    assert.strictEqual(repo.rows.length, 2);
    let swordOp = repo.rows.find((currentRow) => currentRow.item_key === 'sword');
    assert.ok(swordOp);
    assert.strictEqual(swordOp.mint, 'MINT_SWORD');
    assert.strictEqual(swordOp.op, 'bind');
    assert.strictEqual(swordOp.status, 'pending');
    assert.strictEqual(swordOp.user_id, 1);
    let shieldOp = repo.rows.find((currentRow) => currentRow.item_key === 'shield');
    assert.strictEqual(shieldOp.user_id, 2);
    assert.strictEqual(shieldOp.mint, 'MINT_SHIELD');

    // Disabled -> no op rows even with a mapping.
    platform = createFakeExchangePlatform();
    pushItem(platform, 'A', 'sword-1', 'sword', 1);
    service = makeService({'server/blockchain/nft/enabled': false, 'server/blockchain/nft/itemKeyToNft': {
        sword: {mint: 'MINT_SWORD'}
    }});
    await service.onExchangeFinalized(platform);
    assert.strictEqual(service.opsRepository.rows.length, 0);

    // Listener factory: emit FINALIZED on the platform events -> op recorded.
    platform = createFakeExchangePlatform();
    pushItem(platform, 'A', 'sword-1', 'sword', 1);
    service = makeService({'server/blockchain/nft/enabled': true, 'server/blockchain/nft/itemKeyToNft': {
        sword: {mint: 'MINT_SWORD'}
    }});
    let listener = createNftExchangeListener(service);
    platform.events.on(ItemsEvents.EXCHANGE.FINALIZED, listener);
    await platform.events.emit(ItemsEvents.EXCHANGE.FINALIZED, {exchangePlatform: platform});
    assert.strictEqual(service.opsRepository.rows.length, 1);

    // register() attaches the listener to a platform events object.
    platform = createFakeExchangePlatform();
    pushItem(platform, 'A', 'sword-1', 'sword', 1);
    service = makeService({'server/blockchain/nft/enabled': true, 'server/blockchain/nft/itemKeyToNft': {
        sword: {mint: 'MINT_SWORD'}
    }});
    assert.strictEqual(service.register(platform), true);
    await platform.events.emit(ItemsEvents.EXCHANGE.FINALIZED, {exchangePlatform: platform});
    assert.strictEqual(service.opsRepository.rows.length, 1);

    // listenEvents() on an injected events object.
    platform = createFakeExchangePlatform();
    pushItem(platform, 'A', 'sword-1', 'sword', 1);
    service = makeService({'server/blockchain/nft/enabled': true, 'server/blockchain/nft/itemKeyToNft': {
        sword: {mint: 'MINT_SWORD'}
    }});
    service.events = platform.events;
    assert.strictEqual(service.listenEvents(), true);
    await platform.events.emit(ItemsEvents.EXCHANGE.FINALIZED, {exchangePlatform: platform});
    assert.strictEqual(service.opsRepository.rows.length, 1);

    console.log('test-nft-binding: OK');
}

main().catch((error) => {
    console.error('test-nft-binding: FAIL', error);
    process.exit(1);
});
