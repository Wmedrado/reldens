/**
 *
 * Reldens - test-inventory-equipment
 *
 * Pure unit tests for the multi-slot equipment logic in InventoryMessageActions:
 * group items_limit drives how many pieces of the same group can be equipped
 * at once (e.g. 2 rings, 1 helmet), single-limit groups keep the old swap
 * behaviour, over-limit equips are rejected. No live server or database.
 *
 */

const assert = require('assert');
const { InventoryMessageActions } = require('../lib/inventory/server/message-actions');

function makeItem(idx, groupId, equipped)
{
    return {
        idx,
        group_id: groupId,
        equipped: Boolean(equipped),
        getInventoryId: () => 'item-' + idx,
        async equip(){ this.equipped = true; },
        async unequip(){ this.equipped = false; }
    };
}

function makePlayer(items, groupModels)
{
    return {
        inventory: {
            manager: {
                items,
                groups: { groupModels }
            }
        }
    };
}

const RING = {id: 1, key: 'ring', items_limit: 2};
const HELMET = {id: 2, key: 'helmet', items_limit: 1};

async function main()
{
    const actions = new InventoryMessageActions();

    // --- getGroupItemsLimit ------------------------------------------------
    const mgr = {groups: {groupModels: [RING, HELMET]}};
    assert.strictEqual(actions.getGroupItemsLimit(mgr, 1), 2, 'ring group limit is 2');
    assert.strictEqual(actions.getGroupItemsLimit(mgr, 2), 1, 'helmet group limit is 1');
    assert.strictEqual(actions.getGroupItemsLimit(mgr, 999), 1, 'unknown group defaults to 1');
    assert.strictEqual(actions.getGroupItemsLimit({groups: {groupModels: []}}, 1), 1, 'no groups default 1');
    assert.strictEqual(actions.getGroupItemsLimit({groups: {}}, 1), 1, 'no groupModels default 1');

    // --- multi-slot group (rings, limit 2) ---------------------------------
    let ring1 = makeItem(0, 1, false);
    let ring2 = makeItem(1, 1, false);
    let ring3 = makeItem(2, 1, false);
    let p = makePlayer({0: ring1, 1: ring2, 2: ring3}, [RING, HELMET]);

    let res = await actions.executeEquipAction(p, {idx: 0});
    assert.strictEqual(res, true, 'first ring equips');
    assert.strictEqual(ring1.equipped, true, 'ring1 equipped');

    res = await actions.executeEquipAction(p, {idx: 1});
    assert.strictEqual(res, true, 'second ring equips within limit');
    assert.strictEqual(ring1.equipped, true, 'ring1 stays equipped');
    assert.strictEqual(ring2.equipped, true, 'ring2 equipped');

    res = await actions.executeEquipAction(p, {idx: 2});
    assert.strictEqual(res, false, 'third ring rejected (limit 2)');
    assert.strictEqual(ring3.equipped, false, 'ring3 not equipped');
    assert.strictEqual(ring1.equipped, true, 'ring1 unaffected');
    assert.strictEqual(ring2.equipped, true, 'ring2 unaffected');

    // --- single-slot group (helmet, limit 1) -> swap ------------------------
    let helmetA = makeItem(10, 2, false);
    let helmetB = makeItem(11, 2, false);
    let pH = makePlayer({10: helmetA, 11: helmetB}, [RING, HELMET]);

    res = await actions.executeEquipAction(pH, {idx: 10});
    assert.strictEqual(res, true, 'helmet A equips');
    assert.strictEqual(helmetA.equipped, true, 'helmetA equipped');

    res = await actions.executeEquipAction(pH, {idx: 11});
    assert.strictEqual(res, true, 'helmet B equips');
    assert.strictEqual(helmetA.equipped, false, 'helmetA swapped out');
    assert.strictEqual(helmetB.equipped, true, 'helmetB equipped');

    // --- unequip -----------------------------------------------------------
    res = await actions.executeEquipAction(pH, {idx: 11});
    assert.strictEqual(res, true, 'unequip returns true');
    assert.strictEqual(helmetB.equipped, false, 'helmetB unequipped');

    // --- ungrouped item (no group_id) -> default limit 1 swap ----------------
    let itemA = makeItem(20, 0, false);
    let itemB = makeItem(21, 0, false);
    let pU = makePlayer({20: itemA, 21: itemB}, [RING, HELMET]);

    await actions.executeEquipAction(pU, {idx: 20});
    res = await actions.executeEquipAction(pU, {idx: 21});
    assert.strictEqual(res, true, 'ungrouped swap equips');
    assert.strictEqual(itemA.equipped, false, 'old ungrouped item swapped out');
    assert.strictEqual(itemB.equipped, true, 'new ungrouped item equipped');

    // --- countEquippedInGroup ----------------------------------------------
    let countPlayer = makePlayer({
        0: makeItem(0, 1, true),
        1: makeItem(1, 1, true),
        2: makeItem(2, 1, false),
        3: makeItem(3, 2, true)
    }, [RING, HELMET]);
    assert.strictEqual(actions.countEquippedInGroup(countPlayer.inventory.manager.items, 1), 2, '2 rings equipped');
    assert.strictEqual(actions.countEquippedInGroup(countPlayer.inventory.manager.items, 2), 1, '1 helmet equipped');

    console.log('test-inventory-equipment: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
