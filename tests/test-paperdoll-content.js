/**
 *
 * VibeCraft - test-paperdoll-content
 *
 * Content-integrity test for the T2.1 paper-doll equipment migration
 * (beta.50-paperdoll-equipment.sql). The equip/unequip + modifier pipeline is
 * already unit-tested (test-inventory-equipment.js); this guards the DATA that
 * feeds it. A broken group_id, a misspelled stat path, or a colliding item key
 * would make equipment silently do nothing, so the test cross-checks:
 *
 *   slot groups   -> the 6 new groups + sample groups 1-6 cover all 11 Kaetram slots
 *   items_limit   -> ring allows 2, every other slot 1
 *   item group_id -> every item points at a real slot group
 *   modifiers     -> every non-cosmetic item has >=1 modifier on a real stat path
 *   key uniqueness-> no item key collides with sample data
 *
 * Pure file parsing - no live server or database.
 *
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const MIG_DIR = path.join(__dirname, '..', 'migrations', 'development');
const PROD_DIR = path.join(__dirname, '..', 'migrations', 'production');

const equipment = fs.readFileSync(path.join(MIG_DIR, 'beta.50-paperdoll-equipment.sql'), 'utf8');
const sampleData = fs.readFileSync(path.join(PROD_DIR, 'reldens-sample-data-v4.0.0.sql'), 'utf8');

// Kaetram's 11 equipment slots, expressed in our group key vocabulary (chest -> armor).
const KAETRAM_SLOTS = [
    'weapon', 'helmet', 'armor', 'legs', 'boots', 'shield', 'cape', 'pendant', 'ring', 'arrows', 'skins'
];

// The 6 new slots this migration adds (the sample data already defines the other 6).
const NEW_SLOT_KEYS = ['legs', 'cape', 'pendant', 'ring', 'arrows', 'skins'];

// Real player stat paths seeded by reldens-sample-data (stats table).
const STAT_PATH_RE = /^stats\/(atk|def|dodge|speed|aim|hp|mp|mAtk|mDef|stamina)$/;

// ---------------------------------------------------------------------------
// extract helpers
// ---------------------------------------------------------------------------

// (id, 'key', 'label', 'description', 'files_name', sort, items_limit, limit_per_item)
const GROUP_RE = /\(([0-9]+), '([a-z_]+)', '([^']*)', '([^']*)', '([^']*)', ([0-9]+), ([0-9]+), ([0-9]+)\)/g;

function extractGroups(sql)
{
    let groups = [];
    let m;
    while((m = GROUP_RE.exec(sql)) !== null){
        groups.push({
            id: Number(m[1]),
            key: m[2],
            sort: Number(m[6]),
            itemsLimit: Number(m[7])
        });
    }
    return groups;
}

// (id, 'key', type, group_id, 'label', 'description', qty_limit, uses_limit, NULL, NULL, 'customData')
// group_id and description may be NULL (sample consumables/currency).
const ITEM_RE = /\(([0-9]+), '([a-z_0-9]+)', ([0-9]+), (NULL|[0-9]+), '([^']*)', (NULL|'[^']*'), ([0-9]+), ([0-9]+), NULL, NULL, '([^']*)'\)/g;

function extractItems(sql)
{
    let items = [];
    let m;
    while((m = ITEM_RE.exec(sql)) !== null){
        items.push({
            id: Number(m[1]),
            key: m[2],
            type: Number(m[3]),
            groupId: 'NULL' === m[4] ? null : Number(m[4]),
            label: m[5]
        });
    }
    return items;
}

// (id, item_id, 'key', 'property_key', operation, 'value', maxProperty)
const MOD_RE = /\(([0-9]+), ([0-9]+), '([a-z_0-9]+)', '([^']*)', ([0-9]+), '([^']*)', (NULL|'[^']*')\)/g;

function extractModifiers(sql)
{
    let mods = [];
    let m;
    while((m = MOD_RE.exec(sql)) !== null){
        mods.push({
            id: Number(m[1]),
            itemId: Number(m[2]),
            key: m[3],
            propertyKey: m[4],
            operation: Number(m[5]),
            value: m[6]
        });
    }
    return mods;
}

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------

async function main()
{
    const newGroups = extractGroups(equipment);
    const sampleGroups = extractGroups(sampleData);
    const items = extractItems(equipment);
    const mods = extractModifiers(equipment);
    const sampleItems = extractItems(sampleData);

    // --- the 6 missing slots are present with unique, non-colliding keys ------
    assert.strictEqual(newGroups.length, 6, 'migration adds 6 slot groups');
    let newKeys = newGroups.map((g) => g.key);
    assert.strictEqual(new Set(newKeys).size, 6, 'new group keys are unique');
    for(let key of NEW_SLOT_KEYS){
        assert.ok(newKeys.includes(key), 'missing slot "' + key + '" is added');
    }
    let sampleKeys = new Set(sampleGroups.map((g) => g.key));
    for(let key of newKeys){
        assert.ok(!sampleKeys.has(key), 'new group key "' + key + '" does not collide with sample data');
    }

    // --- ring allows 2, every other slot 1 ------------------------------------
    let newGroupById = {};
    for(let g of newGroups){
        newGroupById[g.id] = g;
        if('ring' === g.key){
            assert.strictEqual(g.itemsLimit, 2, 'ring slot allows 2 pieces');
        } else {
            assert.strictEqual(g.itemsLimit, 1, 'slot "' + g.key + '" allows 1 piece');
        }
    }

    // --- the full slot set covers all 11 Kaetram slots -------------------------
    let allSlotKeys = new Set([...sampleKeys, ...newKeys]);
    for(let slot of KAETRAM_SLOTS){
        assert.ok(allSlotKeys.has(slot), 'Kaetram slot "' + slot + '" is covered');
    }

    // --- every item is type equipment and wired to a real group ----------------
    let sampleGroupIds = new Set(sampleGroups.map((g) => g.id));
    let sampleItemKeys = new Set(sampleItems.map((i) => i.key));
    let itemKeys = new Set();
    let itemIds = new Set();
    for(let item of items){
        assert.strictEqual(item.type, 1, 'item "' + item.key + '" is type equipment');
        assert.ok(!itemKeys.has(item.key), 'item key "' + item.key + '" is unique in this migration');
        assert.ok(!sampleItemKeys.has(item.key), 'item key "' + item.key + '" does not collide with sample data');
        itemKeys.add(item.key);
        itemIds.add(item.id);
        let groupExists = sampleGroupIds.has(item.groupId) || newGroupById[item.groupId] !== undefined;
        assert.ok(groupExists, 'item "' + item.key + '" group_id ' + item.groupId + ' points to a real slot');
    }
    assert.strictEqual(items.length, 13, 'one starter item per slot (plus a second ring)');

    // --- every modifier targets a real item and a real stat path ---------------
    for(let mod of mods){
        assert.ok(itemIds.has(mod.itemId), 'modifier ' + mod.id + ' item_id ' + mod.itemId + ' matches a seeded item');
        assert.ok(STAT_PATH_RE.test(mod.propertyKey), 'modifier ' + mod.id + ' targets a real stat path: ' + mod.propertyKey);
        assert.strictEqual(mod.operation, 1, 'modifier ' + mod.id + ' uses flat increment');
        assert.ok(Number(mod.value) > 0, 'modifier ' + mod.id + ' has a positive value');
    }

    // --- every non-cosmetic item has at least one stat modifier ----------------
    let itemsWithMods = new Set(mods.map((m) => m.itemId));
    for(let item of items){
        if('traveler_skin' === item.key){
            assert.ok(!itemsWithMods.has(item.id), 'cosmetic skin has no stat modifier');
            continue;
        }
        assert.ok(itemsWithMods.has(item.id), 'item "' + item.key + '" has at least one stat modifier');
    }

    console.log('test-paperdoll-content: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
