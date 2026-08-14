/**
 *
 * VibeCraft - test-quest-tracking
 *
 * Proves the T2.4 questline gameplay loop: the real QuestPlugin + QuestManager,
 * driven by a mocked dataServer, load the quest definitions and increment the
 * players_quests progress when the player kills the target enemy or crafts the
 * target recipe. A wrong key or a missed event would leave the quest
 * permanently stuck, so this test asserts both the increment and the absence
 * of false positives. No live server or database.
 *
 */

const assert = require('assert');
const { QuestPlugin } = require('../lib/quests/server/plugin');
const { QuestManager } = require('../lib/quests/server/quest-manager');

// ---------------------------------------------------------------------------
// mocked storage: quests, objectives, rewards and players_quests
// ---------------------------------------------------------------------------

function makeDataServer()
{
    // two quests mirroring beta.49-questline-starter (kill + craft):
    let quests = [
        {id: 4, code: 'capital_rats', label: 'Ratos na Fazenda', description: 'Elimine ratos.',
         object_id: 118, reward_exp: 15, is_active: 1},
        {id: 6, code: 'first_plank', label: 'A Primeira Tábua', description: 'Crie uma tabua.',
         object_id: 118, reward_exp: 15, is_active: 1},
        {id: 5, code: 'farm_wood', label: 'Madeira para a Capital', description: 'Colete madeira.',
         object_id: 118, reward_exp: 10, is_active: 1}
    ];
    let objectives = [
        {id: 4, quest_id: 4, type: 'kill', target_key: 'vibecraft_farm_rat', quantity: 3, label: 'Eliminar Ratos'},
        {id: 6, quest_id: 6, type: 'craft', target_key: 'wood_plank', quantity: 1, label: 'Criar Tabua'},
        {id: 5, quest_id: 5, type: 'gather', target_key: 'wood', quantity: 5, label: 'Coletar Madeira'}
    ];
    let rewards = [
        {id: 3, quest_id: 4, item_id: 102, quantity: 5, related_items_item: {key: 'coins', label: 'Coins'}},
        {id: 5, quest_id: 6, item_id: 102, quantity: 3, related_items_item: {key: 'coins', label: 'Coins'}},
        {id: 4, quest_id: 5, item_id: 102, quantity: 5, related_items_item: {key: 'coins', label: 'Coins'}}
    ];
    // players_quests: active rows for player 7 on quests 4 and 6
    let playersRows = {
        '7:4': {id: 1, player_id: 7, quest_id: 4, status: 'active', progress: '{}'},
        '7:6': {id: 2, player_id: 7, quest_id: 6, status: 'active', progress: '{}'}
    };

    let playersQuests = {
        async loadBy(field, value)
        {
            return Object.values(playersRows).filter((r) => r[field] === value);
        },
        async loadOne(where)
        {
            return playersRows[`${where.player_id}:${where.quest_id}`] || null;
        },
        async updateById(id, data)
        {
            for(let key of Object.keys(playersRows)){
                if(playersRows[key].id === id){
                    playersRows[key] = {...playersRows[key], ...data};
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
        // test hook:
        progressFor(playerId, questId)
        {
            let row = playersRows[`${playerId}:${questId}`];
            return row ? JSON.parse(row.progress || '{}') : {};
        }
    };
}

async function main()
{
    let dataServer = makeDataServer();
    let plugin = new QuestPlugin({events: {}, dataServer});
    await plugin.questManager.loadQuests();

    // --- loadQuests built the quests from the same shapes beta.49 seeds ------
    let questsById = plugin.questManager.questsById;
    assert.strictEqual(Object.keys(questsById).length, 3, 'loadQuests loads all active quests');
    assert.strictEqual(questsById[4].objectId, 118, 'quest 4 is anchored to the capital board');
    assert.deepStrictEqual(
        questsById[4].objectives,
        [{id: 4, type: 'kill', targetKey: 'vibecraft_farm_rat', quantity: 3, label: 'Eliminar Ratos'}],
        'kill objective shape'
    );

    // --- a rat kill increments the kill objective ---------------------------
    let player = {player_id: 7};
    await plugin.trackBattleEnded({
        playerSchema: player,
        pve: {targetObject: {object_class_key: 'vibecraft_farm_rat'}}
    });
    let progress = dataServer.progressFor(7, 4);
    assert.strictEqual(progress['kill:vibecraft_farm_rat'], 1, 'rat kill increments the objective');

    // --- a non-matching enemy does not touch the quest -----------------------
    await plugin.trackBattleEnded({
        playerSchema: player,
        pve: {targetObject: {object_class_key: 'vibecraft_farm_goblin'}}
    });
    progress = dataServer.progressFor(7, 4);
    assert.strictEqual(progress['kill:vibecraft_farm_rat'], 1, 'goblin kill does not count for the rat quest');
    assert.strictEqual(Object.keys(progress).length, 1, 'no stray objective keys');

    // --- progress accumulates across kills ----------------------------------
    await plugin.trackBattleEnded({
        playerSchema: player,
        pve: {targetObject: {object_class_key: 'vibecraft_farm_rat'}}
    });
    await plugin.trackBattleEnded({
        playerSchema: player,
        pve: {targetObject: {key: 'vibecraft_farm_rat'}}
    });
    progress = dataServer.progressFor(7, 4);
    assert.strictEqual(progress['kill:vibecraft_farm_rat'], 3, 'progress accumulates to the objective quantity');

    // --- crafting the target recipe increments the craft objective -----------
    await plugin.trackCraftingCompleted({
        playerSchema: player,
        recipe: {code: 'wood_plank'}
    });
    progress = dataServer.progressFor(7, 6);
    assert.strictEqual(progress['craft:wood_plank'], 1, 'wood_plank craft increments the craft objective');

    // --- crafting something else does not ------------------------------------
    await plugin.trackCraftingCompleted({
        playerSchema: player,
        recipe: {code: 'stone_brick'}
    });
    progress = dataServer.progressFor(7, 6);
    assert.strictEqual(progress['craft:wood_plank'], 1, 'unrelated recipe does not count');
    assert.strictEqual(Object.keys(progress).length, 1, 'no stray craft keys');

    console.log('test-quest-tracking: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
