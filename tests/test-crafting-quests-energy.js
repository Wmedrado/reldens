/**
 *
 * Reldens - test-crafting-quests-energy
 *
 * Standalone tests for the ported game systems: crafting object logic, quests
 * (accept/track/turn-in) and energy (regen/consume). These are pure unit tests
 * that do not require a live server or database.
 *
 */

const assert = require('assert');
const { CraftingObject } = require('../lib/crafting/server/crafting-object');
const { QuestManager } = require('../lib/quests/server/quest-manager');
const { QuestPlugin } = require('../lib/quests/server/plugin');
const { QuestGiverObject } = require('../lib/quests/server/quest-giver-object');
const { EnergyManager } = require('../lib/energy/server/energy-manager');
const { EnergyMessageActions } = require('../lib/energy/server/message-actions');

const objCtx = () => Object.create(CraftingObject.prototype);

function fakeInventory(entries)
{
    let uid = 0;
    const items = {};
    for(const [key, qty] of entries){
        items['uid'+(++uid)] = {key, qty};
    }
    return {
        items,
        async removeItem(k){ delete this.items[k]; return true; },
        async decreaseItemQty(k, qty){ this.items[k].qty -= qty; return true; },
        createItemInstance(key, qty){ return {key, qty}; },
        async addItems(arr){ for(const it of arr){ this.items['uid'+(++uid)] = {key: it.key, qty: it.qty}; } return true; },
        client: {extractItemsDataForSend: (list) => list}
    };
}

function stubRepoDataServer(data)
{
    const db = Object.assign({_next: 100}, data);
    return {
        dataServer: {getEntity: (name) => ({
            loadAll: async () => db[name] || [],
            loadBy: async (field, value) => (db[name] || []).filter((r) => r[field] === value),
            loadByWithRelations: async (field, value) => (db[name] || []).filter((r) => r[field] === value),
            loadOneBy: async (field, value) => (db[name] || []).find((r) => r[field] === value) || null,
            loadOne: async (filter) => (db[name] || []).find((r) => Object.entries(filter).every(([k, v]) => r[k] === v)) || null,
            create: async (row) => { const created = Object.assign({id: db._next++}, row); db[name].push(created); return created; },
            updateById: async (id, row) => { Object.assign(db[name].find((r) => r.id === id), row); return db[name].find((r) => r.id === id); }
        })},
        db
    };
}

function questPlayer(items)
{
    let uid = 0;
    const inventoryItems = {};
    for(const [key, qty] of Object.entries(items)){
        inventoryItems['uid'+(++uid)] = {key, qty};
    }
    const player = {
        player_id: 1,
        expAdded: 0,
        inventory: {
            manager: {
                items: inventoryItems,
                createItemInstance: (key, qty) => ({key, qty}),
                addItems: async (arr) => { for(const it of arr){ inventoryItems['uid'+(++uid)] = {key: it.key, qty: it.qty}; } return true; }
            }
        },
        skillsServer: {
            classPath: {
                addExperience: async (exp) => { player.expAdded += exp; }
            }
        }
    };
    return player;
}

(async () => {

    // --- Crafting ---
    const craftContext = objCtx();
    const grouped = craftContext.groupIngredientsByKey([
        {itemKey: 'wood', qty: 2}, {itemKey: 'wood', qty: 1}, {itemKey: 'stone', qty: 5}
    ]);
    assert.strictEqual(grouped.wood.qty, 3);
    assert.strictEqual(grouped.stone.qty, 5);

    const consumeInventory = fakeInventory([['wood', 2], ['wood', 2]]);
    await craftContext.consumeIngredients(consumeInventory, {wood: {qty: 3}});
    assert.strictEqual(Object.keys(consumeInventory.items).length, 1, 'one slot consumed fully');
    assert.strictEqual(Object.values(consumeInventory.items)[0].qty, 1, 'remaining slot decreased');

    // --- Quests ---
    const {dataServer: questDataServer, db} = stubRepoDataServer({
        quests: [
            {id: 1, code: 'kill_trees', label: 'Kill Trees', object_id: null, reward_exp: 20, is_active: 1},
            {id: 2, code: 'gather_wood', label: 'Gather Wood', object_id: null, reward_exp: 10, is_active: 1}
        ],
        questsObjectives: [
            {id: 1, quest_id: 1, type: 'kill', target_key: 'enemy_1', quantity: 2, label: 'Kill Trees'},
            {id: 2, quest_id: 2, type: 'gather', target_key: 'wood', quantity: 5, label: 'Collect Wood'}
        ],
        questsRewards: [
            {id: 1, quest_id: 2, quantity: 5, related_items_item: {key: 'coins', label: 'Coins'}}
        ],
        playersQuests: []
    });
    const questManager = new QuestManager({dataServer: questDataServer});
    await questManager.loadQuests();
    assert.strictEqual(Object.keys(questManager.questsById).length, 2);
    assert.strictEqual(questManager.getQuestsForObject(17).length, 2, 'global quests on any giver');

    await questManager.acceptQuest(1, 1);
    await questManager.acceptQuest(1, 2);
    await questManager.incrementObjective(1, 1, 'kill:enemy_1');
    await questManager.incrementObjective(1, 1, 'kill:enemy_1');
    await questManager.incrementObjective(1, 1, 'kill:enemy_1');
    assert.strictEqual((await questManager.progressForPlayer(1, 1))['kill:enemy_1'], 3);

    const failTurnIn = await questManager.turnInQuest(questManager.questsById[2], questPlayer({}));
    assert.strictEqual(failTurnIn.success, false, 'gather objective not met');

    const playerWood = questPlayer({wood: 5});
    const okTurnIn = await questManager.turnInQuest(questManager.questsById[2], playerWood);
    assert.strictEqual(okTurnIn.success, true);
    assert.strictEqual(playerWood.expAdded, 10);
    assert.ok(Object.values(playerWood.inventory.manager.items).some((i) => i.key === 'coins' && i.qty === 5));
    assert.strictEqual(db.playersQuests.find((p) => p.quest_id === 2).status, 'claimed');

    const plugin = new QuestPlugin({events: {on: () => {}}, dataServer: questDataServer});
    await plugin.setup();
    await questManager.acceptQuest(2, 1);
    await plugin.trackBattleEnded({playerSchema: {player_id: 2}, pve: {targetObject: {object_class_key: 'enemy_1'}}});
    assert.strictEqual((await questManager.progressForPlayer(2, 1))['kill:enemy_1'], 1, 'battle kill tracked');

    const giver = Object.create(QuestGiverObject.prototype);
    Object.assign(giver, {id: 17, questManager});
    const state = await giver.questStateForPlayer(playerWood);
    assert.strictEqual(state.active.length, 1, 'only active quests shown');
    assert.strictEqual(state.active[0].objectives[0].current, 3);

    // --- Energy ---
    const {dataServer: energyDataServer, db: energyDb} = stubRepoDataServer({playersEnergy: []});
    const energyManager = new EnergyManager({dataServer: energyDataServer});
    await energyManager.ensurePlayer(1);
    assert.strictEqual(energyDb.playersEnergy.length, 1);
    const player = {player_id: 1, stats: {energy: 50}, statsBase: {energy: 100}};
    const room = {config: {getWithoutLogs: (path, dflt) => dflt}};

    assert.strictEqual(await energyManager.regen(player, room), 50, 'no regen on fresh timestamp');

    energyDb.playersEnergy[0].last_regen_at = new Date(Date.now() - 10 * 60000);
    assert.strictEqual(await energyManager.regen(player, room), 80, 'regen +30');
    assert.strictEqual(player.stats.energy, 80);

    const consume = await energyManager.consume(player, room, 25);
    assert.strictEqual(consume.success, true);
    assert.strictEqual(consume.energy, 55);

    const playerLow = {player_id: 1, stats: {energy: 5}, statsBase: {energy: 100}};
    energyDb.playersEnergy[0].last_regen_at = new Date();
    const failConsume = await energyManager.consume(playerLow, room, 10);
    assert.strictEqual(failConsume.success, false);
    assert.strictEqual(failConsume.energy, 5);

    const sent = [];
    const client = {send: (key, msg) => sent.push(msg)};
    const actions = new EnergyMessageActions({manager: energyManager});
    const playerMsg = {player_id: 1, stats: {energy: 50}, statsBase: {energy: 100}};
    energyDb.playersEnergy[0].last_regen_at = new Date();
    const saveRoom = {config: {getWithoutLogs: (p, d) => d}, savePlayerStats: async () => {}};
    await actions.executeMessageActions(client, {act: 'energy.use', amount: 10}, saveRoom, playerMsg);
    assert.strictEqual(sent[0].act, 'energy.result');
    assert.strictEqual(sent[0].success, true);
    assert.strictEqual(sent[0].energy, 40);

    console.log('test-crafting-quests-energy: all tests passed');
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
