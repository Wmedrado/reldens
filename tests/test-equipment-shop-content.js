/**
 *
 * VibeCraft - test-equipment-shop-content
 *
 * Content-integrity test for the T2.1/T3.5 equipment shop migration
 * (beta.51-equipment-shop.sql). Cross-checks that every starter equipment item
 * from beta.50 is obtainable from the capital merchant (object 112): it has a
 * stock row, a buy price and a sell price, and the sell price is below the buy
 * price (Kaetram-style price decay, no free money faucet). Pure file parsing -
 * no live server or database.
 *
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const MIG_DIR = path.join(__dirname, '..', 'migrations', 'development');
const read = (f) => fs.readFileSync(path.join(MIG_DIR, f), 'utf8');

const equipment = read('beta.50-paperdoll-equipment.sql');
const shop = read('beta.51-equipment-shop.sql');

// ---------------------------------------------------------------------------
// extract helpers
// ---------------------------------------------------------------------------

// (id, 'key', type, group_id, ...) from beta.50 items_item seeds
const ITEM_RE = /\(([0-9]+), '([a-z_0-9]+)', ([0-9]+), (NULL|[0-9]+), '([^']*)',/g;

function extractItems(sql)
{
    let items = [];
    let m;
    while((m = ITEM_RE.exec(sql)) !== null){
        items.push({id: Number(m[1]), key: m[2], groupId: 'NULL' === m[4] ? null : Number(m[4])});
    }
    return items;
}

// (id, 112, item_id, -1, -1, 0) from objects_items_inventory
const STOCK_RE = /\(([0-9]+), 112, ([0-9]+), -1, -1, 0\)/g;

// (id, 112, 'item_key', 'coins', qty, 1) from objects_items_requirements
const BUY_RE = /\(([0-9]+), 112, '([a-z_0-9]+)', 'coins', ([0-9]+), 1\)/g;

// (id, 112, 'item_key', 'coins', qty, 0) from objects_items_rewards
const SELL_RE = /\(([0-9]+), 112, '([a-z_0-9]+)', 'coins', ([0-9]+), 0\)/g;

function extractAll(re, sql)
{
    let rows = [];
    let m;
    while((m = re.exec(sql)) !== null){
        rows.push(m);
    }
    return rows;
}

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------

async function main()
{
    const items = extractItems(equipment);
    const itemIds = new Set(items.map((i) => i.id));
    const itemKeyById = {};
    for(let i of items){
        itemKeyById[i.id] = i.key;
    }

    const stock = extractAll(STOCK_RE, shop).map((m) => Number(m[2]));
    const buys = extractAll(BUY_RE, shop);
    const sells = extractAll(SELL_RE, shop);

    assert.strictEqual(items.length, 13, 'beta.50 seeds 13 starter items');
    assert.strictEqual(stock.length, 13, 'every starter item is stocked in the merchant');

    // --- every equipment item has a stock row --------------------------------
    for(let id of itemIds){
        assert.ok(stock.includes(id), 'item ' + id + ' is stocked in merchant 112');
    }

    // --- every equipment item has a buy price and a sell price ----------------
    let buyByKey = {};
    for(let m of buys){
        buyByKey[m[2]] = Number(m[3]);
    }
    let sellByKey = {};
    for(let m of sells){
        sellByKey[m[2]] = Number(m[3]);
    }
    for(let item of items){
        assert.ok(buyByKey[item.key] !== undefined, 'item "' + item.key + '" has a buy price');
        assert.ok(sellByKey[item.key] !== undefined, 'item "' + item.key + '" has a sell price');
    }
    assert.strictEqual(Object.keys(buyByKey).length, 13, '13 buy prices');
    assert.strictEqual(Object.keys(sellByKey).length, 13, '13 sell prices');

    // --- sell < buy and both positive (no free money faucet) ------------------
    for(let item of items){
        let buy = buyByKey[item.key];
        let sell = sellByKey[item.key];
        assert.ok(buy > 0, 'item "' + item.key + '" buy price is positive');
        assert.ok(sell > 0, 'item "' + item.key + '" sell price is positive');
        assert.ok(sell < buy, 'item "' + item.key + '" sells for less than it buys');
    }

    console.log('test-equipment-shop-content: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
