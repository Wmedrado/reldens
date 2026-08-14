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
const { StatusEffectsManager } = require('../lib/status-effects/server/status-effects-manager');
const { ChestObject } = require('../lib/chests/server/chest-object');
const { LandPlugin } = require('../lib/land/server/plugin');
const { GatheringObject } = require('../lib/gathering/server/gathering-object');
const { BankManager } = require('../lib/bank/server/bank-manager');
const { BankObject } = require('../lib/bank/server/bank-object');
const { AchievementManager } = require('../lib/achievements/server/achievement-manager');
const { AchievementBoardObject } = require('../lib/achievements/server/achievement-board-object');
const { ServerEventsManager } = require('../lib/events/server/events-manager');
const { EnchantObject } = require('../lib/enchant/server/enchant-object');
const { PetObject } = require('../lib/pets/server/pet-object');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
            updateById: async (id, row) => { Object.assign(db[name].find((r) => r.id === id), row); return db[name].find((r) => r.id === id); },
            deleteById: async (id) => { const idx = db[name].findIndex((r) => r.id === id); if(idx >= 0){ db[name].splice(idx, 1); return true; } return false; }
        })},
        db
    };
}

function makeGatherPlayer(playerId, items)
{
    let uid = 0;
    const inventoryItems = {};
    for(const [key, qty] of Object.entries(items)){
        inventoryItems['uid'+(++uid)] = {key, qty};
    }
    const player = {
        player_id: playerId,
        expAdded: 0,
        inventory: {
            manager: {
                items: inventoryItems,
                createItemInstance: (key, qty) => ({key, qty}),
                addItems: async (arr) => { for(const it of arr){ inventoryItems['uid'+(++uid)] = {key: it.key, qty: it.qty}; } return true; },
                removeItem: async (k) => { delete inventoryItems[k]; return true; },
                decreaseItemQty: async (k, qty) => { inventoryItems[k].qty -= qty; return true; }
            }
        },
        skillsServer: {
            classPath: {
                currentLevel: 1,
                addExperience: async (exp) => { player.expAdded += exp; }
            }
        }
    };
    return player;
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

    // --- Status effects ---
    const statusManager = new StatusEffectsManager();
    const effectTarget = {uid: 'p1', stats: {hp: 100}, statsBase: {hp: 100}};
    await statusManager.applyEffect({
        target: effectTarget,
        key: 'poison',
        propertyKey: 'hp',
        perTick: -10,
        ticks: 3,
        intervalMs: 10
    });
    await sleep(50);
    assert.strictEqual(effectTarget.stats.hp, 70, 'poison applied 3 ticks (-30)');
    assert.deepStrictEqual(Object.keys(statusManager.activeEffects), [], 'effect finished and cleaned');

    // clamp at zero
    const clampTarget = {uid: 'p2', stats: {hp: 5}, statsBase: {hp: 100}};
    await statusManager.applyEffect({
        target: clampTarget,
        key: 'burn',
        propertyKey: 'hp',
        perTick: -10,
        ticks: 5,
        intervalMs: 10
    });
    await sleep(80);
    assert.strictEqual(clampTarget.stats.hp, 0, 'hp clamped at 0');

    // no overlap: reapplying replaces the previous effect
    const overlapTarget = {uid: 'p3', stats: {hp: 100}, statsBase: {hp: 100}};
    await statusManager.applyEffect({
        target: overlapTarget,
        key: 'regen',
        propertyKey: 'hp',
        perTick: 5,
        ticks: 10,
        intervalMs: 10
    });
    await sleep(20);
    await statusManager.applyEffect({
        target: overlapTarget,
        key: 'regen',
        propertyKey: 'hp',
        perTick: 5,
        ticks: 10,
        intervalMs: 10
    });
    await sleep(20);
    assert.deepStrictEqual(Object.keys(statusManager.activeEffects), ['p3.regen'], 'single regen effect active');
    statusManager.dispose();

    // --- Chest ---
    const chest = Object.create(ChestObject.prototype);
    Object.assign(chest, {
        id: 18,
        uid: 'chest-18',
        rewards: [
            {itemKey: 'coins', quantity: 10},
            {itemKey: 'wood', quantity: 3}
        ],
        cooldownUntil: 0,
        content: 'A chest.'
    });
    const chestSent = [];
    const chestClient = {send: (key, msg) => chestSent.push(msg)};
    let chestUid = 0;
    const chestItems = {};
    const chestPlayer = {
        player_id: 1,
        inventory: {
            manager: {
                items: chestItems,
                createItemInstance: (key, qty) => ({key, qty}),
                addItems: async (arr) => { for(const it of arr){ chestItems['uid'+(++chestUid)] = {key: it.key, qty: it.qty}; } return true; }
            }
        }
    };
    const chestRoom = {config: {getWithoutLogs: (path, dflt) => dflt}};
    await chest.openChest(chestClient, chestRoom, chestPlayer);
    const chestItemsList = Object.values(chestItems);
    assert.ok(chestItemsList.some((i) => i.key === 'coins' && i.qty === 10), 'chest grant coins');
    assert.ok(chestItemsList.some((i) => i.key === 'wood' && i.qty === 3), 'chest grant wood');
    assert.ok(chest.cooldownUntil > Date.now(), 'chest cooldown set');
    assert.ok(chestSent[0].content.includes('You received: '), 'chest loot message');
    const grantedCount = Object.keys(chestItems).length;

    // second open during cooldown grants nothing
    await chest.openChest(chestClient, chestRoom, chestPlayer);
    assert.strictEqual(Object.keys(chestItems).length, grantedCount, 'no grant during cooldown');
    assert.strictEqual(chestSent[chestSent.length - 1].content, 'The chest is empty for now, come back later.');

    // --- Land (NFT-gated rooms) ---
    const landWallets = [{id: 1, user_id: 1, pubkey: 'wallet-1'}];
    const landDataServer = {getEntity: (name) => ({
        loadOneBy: async (field, value) => landWallets.find((r) => r[field] === value) || null
    })};
    const denied = [];
    const fakeClient = {
        send: (key, msg) => denied.push(msg),
        leave: () => { denied.push('LEAVE'); }
    };
    const landRoom = {
        roomName: 'private_land',
        config: {getWithoutLogs: (path, dflt) => path === 'server/land/gatedRooms'
            ? {'private_land': {mint: 'MINT-1'}}
            : dflt}
    };

    // allowed when wallet owns the NFT
    let landPlugin = new LandPlugin({
        events: {on: () => {}},
        dataServer: landDataServer,
        findTokenFn: async () => ({mint: 'MINT-1'})
    });
    let result = await landPlugin.gateRoomJoin(landRoom, fakeClient, {id: 1});
    assert.strictEqual(result, true, 'land allowed with NFT');
    assert.strictEqual(denied.length, 0, 'no deny when allowed');

    // denied when NFT not owned
    landPlugin = new LandPlugin({
        events: {on: () => {}},
        dataServer: landDataServer,
        findTokenFn: async () => null
    });
    result = await landPlugin.gateRoomJoin(landRoom, fakeClient, {id: 1});
    assert.strictEqual(result, false, 'land denied without NFT');
    assert.ok(denied.includes('LEAVE'), 'client left on deny');

    // denied when no wallet linked
    denied.length = 0;
    const landNoWallet = {getEntity: (name) => ({loadOneBy: async () => null})};
    landPlugin = new LandPlugin({
        events: {on: () => {}},
        dataServer: landNoWallet,
        findTokenFn: async () => ({mint: 'MINT-1'})
    });
    result = await landPlugin.gateRoomJoin(landRoom, fakeClient, {id: 2});
    assert.strictEqual(result, false, 'land denied without wallet');
    assert.ok(denied.includes('LEAVE'), 'client left without wallet');

    // ungated room is always allowed
    denied.length = 0;
    landPlugin = new LandPlugin({
        events: {on: () => {}},
        dataServer: landDataServer,
        findTokenFn: async () => null
    });
    result = await landPlugin.gateRoomJoin(
        {roomName: 'town', config: {getWithoutLogs: (p, d) => ({})}},
        fakeClient,
        {id: 1}
    );
    assert.strictEqual(result, true, 'ungated room allowed');
    assert.strictEqual(denied.length, 0, 'no deny on ungated room');

    // --- Gathering ---
    const gatheringDataServer = {getEntity: (name) => ({
        loadByWithRelations: async () => [{
            id: 1, code: 'tree_wood', label: 'Wooden Tree', item_id: 7,
            experience: 5, difficulty: 10, level_requirement: 2, max_yields: 1, respawn_time: 500,
            min_qty: 1, max_qty: 2,
            related_items_item: {key: 'wood', label: 'Wood'}
        }]
    })};
    const tree = Object.create(GatheringObject.prototype);
    Object.assign(tree, {
        id: 19, uid: 'tree-19', dataServer: gatheringDataServer, events: {emit: async () => {}},
        yields: 0, gathering: false, cooldownUntil: 0, content: 'A tree.', resource: false, options: {}
    });
    await tree.loadResource();
    assert.ok(tree.resource && tree.resource.itemKey === 'wood', 'tree resource loaded');
    const gatherSent = [];
    const gatherClient = {send: (k, m) => gatherSent.push(m)};
    const gatherRoom = {config: {getWithoutLogs: (p, d) => d}};
    const treePlayer = makeGatherPlayer(1, {});
    // level too low
    treePlayer.skillsServer.classPath.currentLevel = 1;
    await tree.doGather(gatherClient, gatherRoom, treePlayer);
    assert.ok(gatherSent[gatherSent.length - 1].content.includes('too low'), 'level gate message');
    assert.deepStrictEqual(Object.values(treePlayer.inventory.manager.items), [], 'nothing gathered at low level');
    // success
    treePlayer.skillsServer.classPath.currentLevel = 2;
    await tree.doGather(gatherClient, gatherRoom, treePlayer);
    await sleep(40);
    assert.strictEqual(treePlayer.expAdded, 5, 'gathering experience granted');
    assert.ok(Object.values(treePlayer.inventory.manager.items).some((i) => i.key === 'wood' && i.qty >= 1), 'wood yielded');
    const gatherMsg = gatherSent[gatherSent.length - 1];
    assert.strictEqual(gatherMsg.listener, 'gathering', 'gathering listener');
    assert.ok(tree.cooldownUntil > Date.now(), 'tree depleted after max yields');

    // --- Bank ---
    const {dataServer: bankDataServer, db: bankDb} = stubRepoDataServer({bankItems: []});
    const bankManager = new BankManager({dataServer: bankDataServer});
    const bankPlayer = makeGatherPlayer(1, {wood: 5, coins: 3});
    // deposit 2 wood
    const woodIdx = Object.keys(bankPlayer.inventory.manager.items).find((i) => bankPlayer.inventory.manager.items[i].key === 'wood');
    let dep = await bankManager.deposit(bankPlayer, woodIdx, 2);
    assert.strictEqual(dep, true, 'bank deposit ok');
    assert.strictEqual(bankPlayer.inventory.manager.items[woodIdx].qty, 3, 'inventory decreased');
    assert.strictEqual((await bankManager.rowForPlayerItem(1, 'wood')).qty, 2, 'bank row qty 2');
    // deposit rest (removes slot)
    dep = await bankManager.deposit(bankPlayer, woodIdx, 3);
    assert.strictEqual(dep, true, 'deposit rest ok');
    assert.ok(!bankPlayer.inventory.manager.items[woodIdx], 'inventory slot removed');
    assert.strictEqual((await bankManager.rowForPlayerItem(1, 'wood')).qty, 5, 'bank row qty 5');
    // withdraw 2
    let wd = await bankManager.withdraw(bankPlayer, 'wood', 2);
    assert.strictEqual(wd, true, 'bank withdraw ok');
    assert.strictEqual((await bankManager.rowForPlayerItem(1, 'wood')).qty, 3, 'bank row after withdraw');
    assert.ok(Object.values(bankPlayer.inventory.manager.items).some((i) => i.key === 'wood' && i.qty === 2), 'withdrawn back to inventory');
    // withdraw too much fails
    wd = await bankManager.withdraw(bankPlayer, 'wood', 99);
    assert.strictEqual(wd, false, 'withdraw too much fails');
    // BankObject openBank builds state
    const banker = Object.create(BankObject.prototype);
    Object.assign(banker, {id: 20, bankManager});
    const bankSent = [];
    const bankerClient = {send: (k, m) => bankSent.push(m)};
    const bankerRoom = {config: {inventory: {items: {wood: {data: {label: 'Wood'}}}}}};
    await banker.openBank(bankerClient, bankerRoom, bankPlayer);
    const bankState = bankSent[0].result;
    assert.strictEqual(bankState.listener, undefined, 'result has no listener key (listener on message)');
    assert.ok(bankState.bank.some((i) => i.key === 'wood' && i.qty === 3), 'bank state shows wood');
    assert.ok(bankState.inventory.some((i) => i.key === 'coins'), 'bank state shows inventory');

    // --- Achievements ---
    const achData = {getEntity: (name) => ({
        loadByWithRelations: async (field, value) => field === 'is_active' ? [
            {id: 1, code: 'first_wood', label: 'Wood Gatherer', description: '', type: 'gather', target_key: 'tree_wood', quantity: 2, reward_item_id: null, reward_exp: 10, is_active: 1, related_items_item: null},
            {id: 2, code: 'first_kill', label: 'Slayer', description: '', type: 'kill', target_key: null, quantity: 2, reward_item_id: null, reward_exp: 5, is_active: 1, related_items_item: null}
        ] : [],
        loadBy: async (field, value) => field === 'player_id' ? (achDb.rows || []).filter(r => r.player_id === value) : [],
        loadOne: async (flt) => (achDb.rows || []).find(r => Object.entries(flt).every(([k,v]) => r[k] === v)) || null,
        create: async (row) => { const r = Object.assign({id: (achDb.rows||[]).length + 1}, row); (achDb.rows || (achDb.rows=[])).push(r); return r; },
        updateById: async (id, row) => Object.assign((achDb.rows||[]).find(r => r.id === id), row)
    })};
    const achDb = {rows: []};
    const achManager = new AchievementManager({dataServer: achData, events: {emit: async () => {}}});
    await achManager.loadAchievements();
    assert.strictEqual(Object.keys(achManager.achievementsById).length, 2, 'achievements loaded');
    await achManager.increment(1, 'gather:tree_wood');
    await achManager.increment(1, 'gather:tree_wood');
    let achProgress = await achManager.progressForPlayer(1, 1);
    assert.strictEqual(achProgress['gather:tree_wood'], 2, 'gather achievement progress');
    const achPlayer = makeGatherPlayer(1, {});
    const achClaimed = await achManager.claim(achManager.achievementsById[1], achPlayer);
    assert.strictEqual(achClaimed.success, true, 'achievement claim ok');
    assert.strictEqual(achPlayer.expAdded, 10, 'achievement exp');
    assert.strictEqual(achDb.rows.find(r => r.achievement_id === 1).status, 'claimed', 'achievement marked claimed');
    // second claim blocked
    const achClaimed2 = await achManager.claim(achManager.achievementsById[1], achPlayer);
    assert.strictEqual(achClaimed2.success, false, 'no double claim');
    // not met yet
    const achNotMet = await achManager.claim(achManager.achievementsById[2], achPlayer);
    assert.strictEqual(achNotMet.success, false, 'unmet achievement not claimable');

    // --- Server events ---
    const eventsCfg = {getWithoutLogs: (path, dflt) => path === 'server/events/doubleGathering' ? true : false};
    const eventsManager = new ServerEventsManager({events: {emit: async () => {}}, config: eventsCfg});
    eventsManager.loadConfig();
    assert.strictEqual(eventsManager.multiplier('server/events/doubleGathering'), 2, 'double gathering multiplier');
    assert.strictEqual(eventsManager.multiplier('server/events/doubleExperience'), 1, 'single experience');
    assert.strictEqual(eventsManager.publicState().doubleGathering, true, 'public state flag');

    // --- Enchant ---
    const enchantData = {getEntity: (name) => ({
        loadByWithRelations: async (field, value) => [{
            id: 1, code: 'axe_to_spear', label: 'Axe → Spear', output_qty: 1, is_active: 1,
            related_input_item: {key: 'axe', label: 'Axe'},
            related_catalyst_item: {key: 'shard_magic', label: 'Magic Shard'},
            related_output_item: {key: 'spear', label: 'Spear'}
        }]
    })};
    const enchanter = Object.create(EnchantObject.prototype);
    Object.assign(enchanter, {id: 21, dataServer: enchantData, events: {emit: async () => {}}, enchantments: {}});
    await enchanter.loadEnchantments();
    assert.strictEqual(Object.keys(enchanter.enchantments).length, 1, 'enchantments loaded');
    const enchantPlayer = makeGatherPlayer(1, {axe: 1, shard_magic: 1});
    const enchantOk = await enchanter.doEnchant(enchanter.enchantments[1], enchantPlayer);
    assert.strictEqual(enchantOk, true, 'enchant ok');
    const enchantItems = Object.values(enchantPlayer.inventory.manager.items);
    assert.ok(!enchantItems.some(i => i.key === 'axe'), 'input consumed');
    assert.ok(!enchantItems.some(i => i.key === 'shard_magic'), 'catalyst consumed');
    assert.ok(enchantItems.some(i => i.key === 'spear' && i.qty === 1), 'output produced');
    // insufficient ingredients
    const enchantPlayer2 = makeGatherPlayer(1, {axe: 1});
    const enchantFail = await enchanter.doEnchant(enchanter.enchantments[1], enchantPlayer2);
    assert.strictEqual(enchantFail, false, 'enchant fails without catalyst');

    // --- Pets ---
    const petsData = {getEntity: (name) => {
        if(name === 'pets'){ return {loadByWithRelations: async () => [{key: 'pixel_slime', label: 'Pixel Slime', adopt_item_id: 11, is_active: 1, related_items_item: {key: 'pet_egg', label: 'Pet Egg'}}]}; }
        if(name === 'playersPets'){ return {
            loadOneBy: async (field, value) => (petsDb.rows || []).find(r => r[field] === value) || null,
            create: async (row) => { const r = Object.assign({id: 1}, row); (petsDb.rows || (petsDb.rows=[])).push(r); return r; }
        }; }
        return {};
    }};
    const petsDb = {rows: []};
    const petDealer = Object.create(PetObject.prototype);
    Object.assign(petDealer, {id: 22, dataServer: petsData, pets: {}});
    await petDealer.loadPets();
    const petPlayer = makeGatherPlayer(1, {pet_egg: 1});
    const adoptOk = await petDealer.adoptPet(petPlayer, 'pixel_slime');
    assert.strictEqual(adoptOk, true, 'pet adopted');
    assert.ok(!Object.values(petPlayer.inventory.manager.items).some(i => i.key === 'pet_egg'), 'pet egg consumed');
    const owned = await petDealer.ownedPet(1);
    assert.strictEqual(owned.pet_key, 'pixel_slime', 'pet owned');
    const adoptAgain = await petDealer.adoptPet(petPlayer, 'pixel_slime');
    assert.strictEqual(adoptAgain, false, 'cannot adopt twice');

    console.log('test-crafting-quests-energy: all tests passed');
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
