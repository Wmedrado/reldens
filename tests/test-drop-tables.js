/**
 *
 * Reldens - test-drop-tables
 *
 * Standalone tests for the drop tables system (pure logic, no live server).
 *
 */

const assert = require('assert');
const { DropTablesProcessor } = require('../lib/rewards/server/drop-tables-processor');

(async () => {

    // roll uses a 100000 scale, max chance always drops, zero never drops:
    assert.strictEqual(DropTablesProcessor.roll({chance: 100000}), true);
    assert.strictEqual(DropTablesProcessor.roll({chance: 0}), false);

    // min player level gates the drop:
    let lowLevelPlayer = {skillsServer: {classPath: {currentLevel: 3}}};
    let highLevelItem = {minPlayerLevel: 10};
    assert.strictEqual(
        await DropTablesProcessor.playerCanDrop(highLevelItem, lowLevelPlayer, false),
        false
    );
    let highLevelPlayer = {skillsServer: {classPath: {currentLevel: 12}}};
    assert.strictEqual(
        await DropTablesProcessor.playerCanDrop(highLevelItem, highLevelPlayer, false),
        true
    );

    // without an events manager gating passes:
    assert.strictEqual(
        await DropTablesProcessor.playerCanDrop({minPlayerLevel: 0}, highLevelPlayer, false),
        true
    );

    // events can block the drop through reldens.dropTablesItemGate:
    let blockingEvents = {
        emit: async (eventName, gate) => {
            assert.strictEqual(eventName, 'reldens.dropTablesItemGate');
            gate.canDrop = false;
        }
    };
    assert.strictEqual(
        await DropTablesProcessor.playerCanDrop({minPlayerLevel: 0}, highLevelPlayer, blockingEvents),
        false
    );

    // toReward creates a valid Reward for the rewards pipeline:
    let item = {item: {id: 42, key: 'gold_coin'}, quantity: 3};
    let reward = DropTablesProcessor.toReward(item);
    assert.strictEqual(reward.isItemType(), 42);
    assert.strictEqual(reward.dropQuantity, 3);
    assert.strictEqual(reward.dropRate, 100);
    assert.strictEqual(reward.hasDropBody, false);

    // getWinningRewards returns one winning reward per table when chance is max:
    let targetObject = {
        dropTables: [
            {key: 'ordinary', items: [{item: {id: 1}, chance: 100000, quantity: 1, minPlayerLevel: 0}]},
            {key: 'unusual', items: [{item: {id: 2}, chance: 100000, quantity: 2, minPlayerLevel: 0}]}
        ]
    };
    let winning = await DropTablesProcessor.getWinningRewards(targetObject, highLevelPlayer, false);
    assert.strictEqual(winning.length, 2);
    assert.strictEqual(winning[0].itemId, 1);
    assert.strictEqual(winning[1].dropQuantity, 2);

    // zero chance table never drops:
    let noDropObject = {
        dropTables: [{key: 'empty', items: [{item: {id: 9}, chance: 0, quantity: 1, minPlayerLevel: 0}]}]
    };
    let emptyWinning = await DropTablesProcessor.getWinningRewards(noDropObject, highLevelPlayer, false);
    assert.strictEqual(emptyWinning.length, 0);

    // object without drop tables returns empty:
    let plainObject = {};
    assert.strictEqual((await DropTablesProcessor.getWinningRewards(plainObject, highLevelPlayer, false)).length, 0);

    // player level below required drops nothing from the table:
    let gatedObject = {
        dropTables: [{key: 'gated', items: [{item: {id: 7}, chance: 100000, quantity: 1, minPlayerLevel: 50}]}]
    };
    assert.strictEqual(
        (await DropTablesProcessor.getWinningRewards(gatedObject, lowLevelPlayer, false)).length,
        0
    );

    console.log('test-drop-tables: all tests passed');
})();
