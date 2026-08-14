/**
 *
 * VibeCraft - test-quest-rewards
 *
 * Closes the T2.4 quest loop: turnInQuest with met objectives grants the item
 * + reward_exp to the player (feeding the T2.3 XP curve), marks the quest
 * claimed, and refuses an incomplete quest. Uses the REAL QuestManager with a
 * mocked dataServer and inventory. No live server or database.
 *
 */

const assert = require('assert');
const { QuestManager } = require('../lib/quests/server/quest-manager');

// ---------------------------------------------------------------------------
// mocks
// ---------------------------------------------------------------------------

function makeDataServer(seedProgress)
{
    let quests = [
        {id: 4, code: 'capital_rats', label: 'Ratos na Fazenda', description: 'Elimine ratos.',
         object_id: 118, reward_exp: 15, is_active: 1}
    ];
    let objectives = [
        {id: 4, quest_id: 4, type: 'kill', target_key: 'vibecraft_farm_rat', quantity: 3, label: 'Eliminar Ratos'}
    ];
    let rewards = [
        {id: 3, quest_id: 4, item_id: 102, quantity: 5, related_items_item: {key: 'coins', label: 'Coins'}}
    ];
    let rows = {
        '7:4': {id: 1, player_id: 7, quest_id: 4, status: 'active', progress: JSON.stringify(seedProgress || {})}
    };
    let playersQuests = {
        async loadBy(field, value)
        {
            return Object.values(rows).filter((r) => r[field] === value);
        },
        async loadOne(where)
        {
            return rows[`${where.player_id}:${where.quest_id}`] || null;
        },
        async updateById(id, data)
        {
            for(let key of Object.keys(rows)){
                if(rows[key].id === id){
                    rows[key] = {...rows[key], ...data};
                }
            }
        }
    };
    return {
        getEntity: (name) => {
            if('quests' === name){
                return {async loadAll(){ return quests; }};
            }
            if('questsObjectives' === name){
                return {async loadByWithRelations(field, value){ return objectives.filter((o) => o[field] === value); }};
            }
            if('questsRewards' === name){
                return {async loadByWithRelations(field, value){ return rewards.filter((r) => r[field] === value); }};
            }
            if('playersQuests' === name){
                return playersQuests;
            }
            return null;
        },
        statusFor(playerId, questId)
        {
            let row = rows[`${playerId}:${questId}`];
            return row ? row.status : null;
        }
    };
}

function makePlayer()
{
    let grantedXp = [];
    let addedItems = [];
    return {
        player_id: 7,
        skillsServer: {
            classPath: {
                async addExperience(exp){ grantedXp.push(Number(exp)); }
            }
        },
        inventory: {
            manager: {
                createItemInstance(key, qty){ return {key, qty}; },
                async addItems(instances){ addedItems.push(...instances); return true; }
            }
        },
        // test hooks:
        get grantedXp(){ return grantedXp; },
        get addedItems(){ return addedItems; }
    };
}

async function loadManager(seedProgress)
{
    let dataServer = makeDataServer(seedProgress);
    let manager = new QuestManager({dataServer});
    await manager.loadQuests();
    assert.ok(manager.questsById[4], 'quest 4 loaded');
    return {dataServer, manager};
}

async function main()
{
    // --- incomplete quest is refused, nothing granted ------------------------
    let {dataServer, manager} = await loadManager({'kill:vibecraft_farm_rat': 1});
    let player = makePlayer();
    let res = await manager.turnInQuest(manager.questsById[4], player);
    assert.strictEqual(res.success, false, 'incomplete quest is refused');
    assert.strictEqual(res.message, 'NOT_COMPLETED', 'refusal reason is NOT_COMPLETED');
    assert.strictEqual(dataServer.statusFor(7, 4), 'active', 'status unchanged');
    assert.strictEqual(player.grantedXp.length, 0, 'no XP granted on refusal');
    assert.strictEqual(player.addedItems.length, 0, 'no items granted on refusal');

    // --- complete quest grants item + XP and marks claimed -------------------
    let {dataServer: complete, manager: completeManager} = await loadManager({'kill:vibecraft_farm_rat': 3});
    let completePlayer = makePlayer();
    res = await completeManager.turnInQuest(completeManager.questsById[4], completePlayer);
    assert.strictEqual(res.success, true, 'complete quest is accepted');
    assert.strictEqual(res.message, 'COMPLETED', 'completion message');
    assert.deepStrictEqual(completePlayer.grantedXp, [15], 'reward_exp 15 feeds the class path');
    assert.strictEqual(completePlayer.addedItems.length, 1, 'one reward item added');
    assert.strictEqual(completePlayer.addedItems[0].key, 'coins', 'reward is coins');
    assert.strictEqual(completePlayer.addedItems[0].qty, 5, 'reward quantity is 5');
    assert.strictEqual(complete.statusFor(7, 4), 'claimed', 'quest marked claimed');

    console.log('test-quest-rewards: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
