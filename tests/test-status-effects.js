/**
 *
 * Reldens - test-status-effects
 *
 * Standalone tests for the status effects module: timed stat-delta effects
 * (damage/heal over time), clamping to statsBase, auto-finish, remove/reapply
 * semantics, onTick/onEnd callbacks and the message-actions wiring. Pure unit
 * tests, no live server or database required.
 *
 */

const assert = require('assert');
const { StatusEffectsManager } = require('../lib/status-effects/server/status-effects-manager');
const { StatusEffectsMessageActions } = require('../lib/status-effects/server/message-actions');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function newTarget(uid, stats, statsBase)
{
    return {uid, stats, statsBase};
}

(async () => {

    // --- apply reduces/increases the stat per tick and auto-finishes ---
    const poison = newTarget('p1', {hp: 100}, {hp: 100});
    const mgr = new StatusEffectsManager();
    await mgr.applyEffect({
        target: poison,
        key: 'poison',
        propertyKey: 'hp',
        perTick: -10,
        ticks: 3,
        intervalMs: 10
    });
    await sleep(60);
    assert.strictEqual(poison.stats.hp, 70, 'poison applied -10 across 3 ticks');
    assert.deepStrictEqual(Object.keys(mgr.activeEffects), [], 'effect auto-finished and cleaned up');

    // --- heal over time is clamped at statsBase ---
    const heal = newTarget('p2', {hp: 50}, {hp: 100});
    await mgr.applyEffect({
        target: heal,
        key: 'heal',
        propertyKey: 'hp',
        perTick: 30,
        ticks: 3,
        intervalMs: 10
    });
    await sleep(60);
    assert.strictEqual(heal.stats.hp, 100, 'heal clamped at statsBase max (100), not 110');

    // --- damage is clamped at zero ---
    const burn = newTarget('p3', {hp: 5}, {hp: 100});
    await mgr.applyEffect({
        target: burn,
        key: 'burn',
        propertyKey: 'hp',
        perTick: -10,
        ticks: 5,
        intervalMs: 10
    });
    await sleep(80);
    assert.strictEqual(burn.stats.hp, 0, 'burn clamped at zero');

    // --- onTick callback receives every tick ---
    const onTickTarget = newTarget('p4', {hp: 80}, {hp: 100});
    const tickValues = [];
    await mgr.applyEffect({
        target: onTickTarget,
        key: 'regen',
        propertyKey: 'hp',
        perTick: 5,
        ticks: 2,
        intervalMs: 10,
        onTick: async ({target, effect, current}) => {
            tickValues.push(current);
        }
    });
    await sleep(40);
    assert.strictEqual(tickValues.length, 2, 'onTick fired once per tick');
    assert.deepStrictEqual(tickValues, [85, 90], 'onTick receives the updated stat value on each tick');

    // --- onEnd callback fires when the effect finishes ---
    let ended = false;
    let endedKey = false;
    const onEndTarget = newTarget('p5', {hp: 0}, {hp: 100});
    await mgr.applyEffect({
        target: onEndTarget,
        key: 'regen2',
        propertyKey: 'hp',
        perTick: 10,
        ticks: 1,
        intervalMs: 10,
        onEnd: async ({target, effect}) => {
            ended = true;
            endedKey = effect.key;
        }
    });
    await sleep(30);
    assert.strictEqual(ended, true, 'onEnd fired after final tick');
    assert.strictEqual(endedKey, 'regen2', 'onEnd receives the effect');
    assert.strictEqual(onEndTarget.stats.hp, 10, 'single tick applied');

    // --- removeEffect stops the loop and fires onEnd ---
    const removed = newTarget('p6', {hp: 100}, {hp: 100});
    let removedOnEnd = false;
    await mgr.applyEffect({
        target: removed,
        key: 'sap',
        propertyKey: 'hp',
        perTick: -10,
        ticks: 20,
        intervalMs: 10,
        onEnd: async () => {
            removedOnEnd = true;
        }
    });
    await sleep(15);
    const removedBefore = removed.stats.hp;
    assert.ok(removedBefore < 100, 'effect ticked before removal');
    await mgr.removeEffect(removed, 'sap');
    assert.strictEqual(removedOnEnd, true, 'removeEffect fires onEnd');
    assert.deepStrictEqual(Object.keys(mgr.activeEffects), [], 'removeEffect cleaned active effects');
    const afterRemove = removed.stats.hp;
    await sleep(40);
    assert.strictEqual(removed.stats.hp, afterRemove, 'no more ticks after removal');

    // --- reapply replaces the previous effect (no overlap) ---
    const overlap = newTarget('p7', {hp: 100}, {hp: 100});
    await mgr.applyEffect({
        target: overlap,
        key: 'regen3',
        propertyKey: 'hp',
        perTick: 5,
        ticks: 10,
        intervalMs: 10
    });
    await sleep(20);
    await mgr.applyEffect({
        target: overlap,
        key: 'regen3',
        propertyKey: 'hp',
        perTick: 5,
        ticks: 10,
        intervalMs: 10
    });
    await sleep(20);
    assert.deepStrictEqual(Object.keys(mgr.activeEffects), ['p7.regen3'], 'single regen effect active after reapply');
    mgr.dispose();

    // --- different targets with the same key do not collide ---
    const tA = newTarget('a', {hp: 100}, {hp: 100});
    const tB = newTarget('b', {hp: 100}, {hp: 100});
    await mgr.applyEffect({target: tA, key: 'dot', propertyKey: 'hp', perTick: -10, ticks: 20, intervalMs: 10});
    await mgr.applyEffect({target: tB, key: 'dot', propertyKey: 'hp', perTick: -10, ticks: 20, intervalMs: 10});
    assert.deepStrictEqual(Object.keys(mgr.activeEffects).sort(), ['a.dot', 'b.dot'], 'per-target effect keys');

    // --- invalid inputs are rejected ---
    assert.strictEqual(await mgr.applyEffect({}), false, 'missing target/key/propertyKey rejected');
    assert.strictEqual(
        await mgr.applyEffect({target: {uid: 'x'}, key: 'k', propertyKey: 'hp'}),
        false,
        'target without "stats" rejected'
    );

    // --- dispose clears every active effect ---
    mgr.dispose();
    assert.deepStrictEqual(Object.keys(mgr.activeEffects), [], 'dispose cleared active effects');

    // --- message-actions wiring: apply runs onTick savePlayerStats and sends result ---
    const actionsMgr = new StatusEffectsManager();
    const sent = [];
    const saved = [];
    const client = {send: (key, msg) => sent.push(msg)};
    const room = {savePlayerStats: async (target, c) => { saved.push({target, c}); }};
    const actions = new StatusEffectsMessageActions({manager: actionsMgr});
    const playerMsg = {player_id: 1, stats: {hp: 100}, statsBase: {hp: 100}};
    await actions.executeMessageActions(client, {
        act: 'status.apply',
        effect: {key: 'poison', propertyKey: 'hp', perTick: -10, ticks: 2, intervalMs: 10}
    }, room, playerMsg);
    assert.strictEqual(sent[0].act, 'status.result', 'apply sends status.result');
    assert.strictEqual(sent[0].success, true, 'apply reports success');
    await sleep(40);
    assert.strictEqual(playerMsg.stats.hp, 80, 'message-actions effect ran on the player');
    assert.ok(saved.length > 0, 'onTick persisted stats via room.savePlayerStats');

    // --- message-actions remove path ---
    await actions.executeMessageActions(client, {act: 'status.remove', key: 'poison'}, room, playerMsg);
    assert.strictEqual(sent[1].act, 'status.result', 'remove sends status.result');
    assert.strictEqual(sent[1].success, true, 'remove reports success');
    actionsMgr.dispose();

    console.log('test-status-effects: all tests passed');
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
