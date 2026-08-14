/**
 *
 * VibeCraft - test-questline-content
 *
 * Content-integrity test for the T2.4 starter questline migration
 * (beta.49-questline-starter.sql). The quest machine (lib/quests) only
 * advances objectives when the target key really exists in the world, so a
 * wrong key means a permanently stuck quest. This test cross-checks every
 * referenced key against the source content migrations:
 *
 *   kill  objectives  -> enemy object_class_key (beta.48-vibecraft-creatures)
 *   gather objectives -> item key (items_item seeds)
 *   craft  objectives -> recipe code (crafting_recipes seeds)
 *   rewards item_id   -> coins item (102)
 *
 * It also asserts the arc's total reward_exp actually levels a fresh player
 * under the T2.3 curve (round(15 * level^2.4)). Pure file parsing - no live
 * server or database.
 *
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const MIG_DIR = path.join(__dirname, '..', 'migrations', 'development');
const read = (f) => fs.readFileSync(path.join(MIG_DIR, f), 'utf8');

const questline = read('beta.49-questline-starter.sql');
const creatures = read('beta.48-vibecraft-creatures.sql');
const crafting = read('beta.40-crafting-demo-data.sql');

// ---------------------------------------------------------------------------
// extract helpers
// ---------------------------------------------------------------------------

function extractObjectiveTargets(type)
{
    // (id, quest_id, type, target_key, quantity, label) - numerics unquoted
    let re = new RegExp("\\(([0-9]+), ([0-9]+), '" + type + "', '([^']+)', ([0-9]+), '([^']*)'\\)", 'g');
    let rows = [];
    let m;
    while((m = re.exec(questline)) !== null){
        rows.push({questId: Number(m[2]), targetKey: m[3], quantity: Number(m[4])});
    }
    return rows;
}

function extractItemKeys(migration)
{
    // items_item seeds: (id, key, type, group_id, label, ...)
    let keys = new Set();
    let re = /\(([0-9]+), '([^']+)', ([0-9]+), NULL, '([^']*)'/g;
    let m;
    while((m = re.exec(migration)) !== null){
        keys.add(m[2]);
    }
    return keys;
}

function extractRecipeCodes(migration)
{
    let codes = new Set();
    let re = /\(([0-9]+), '([^']+)', '([^']+)'/g;
    let m;
    while((m = re.exec(migration)) !== null){
        codes.add(m[2]);
    }
    return codes;
}

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------

async function main()
{
    // --- the questline references real enemies ------------------------------
    let killObjectives = extractObjectiveTargets('kill');
    assert.strictEqual(killObjectives.length, 4, 'questline has 4 kill objectives');
    for(let objective of killObjectives){
        let enemyRe = new RegExp("'vibecraft_farm_" + objective.targetKey.replace(/^vibecraft_farm_/, '') + "'", 'g');
        assert.ok(
            enemyRe.test(creatures),
            'kill target "' + objective.targetKey + '" exists as an enemy in beta.48-vibecraft-creatures'
        );
        assert.ok(objective.quantity > 0, 'kill objective quantity is positive');
    }

    // --- gather objectives reference real item keys -------------------------
    let gatherObjectives = extractObjectiveTargets('gather');
    assert.strictEqual(gatherObjectives.length, 1, 'questline has 1 gather objective');
    let itemKeys = extractItemKeys(crafting); // wood / wood_plank live here
    for(let objective of gatherObjectives){
        assert.ok(itemKeys.has(objective.targetKey), 'gather target "' + objective.targetKey + '" is a real item key');
    }

    // --- craft objectives reference real recipe codes -----------------------
    let craftObjectives = extractObjectiveTargets('craft');
    assert.strictEqual(craftObjectives.length, 1, 'questline has 1 craft objective');
    let recipeCodes = extractRecipeCodes(crafting);
    for(let objective of craftObjectives){
        assert.ok(recipeCodes.has(objective.targetKey), 'craft target "' + objective.targetKey + '" is a real recipe code');
    }

    // --- quest ids line up across quests / objectives -----------------------
    // (id, 'code', 'label', 'description', object_id, reward_exp, is_active)
    let questIdRe = /\n    \(([0-9]+), '([a-z_]+)',/g;
    let questIds = [];
    let m;
    while((m = questIdRe.exec(questline)) !== null){
        questIds.push(Number(m[1]));
    }
    assert.strictEqual(questIds.length, 6, 'questline has 6 quests');
    for(let objective of [...killObjectives, ...gatherObjectives, ...craftObjectives]){
        assert.ok(questIds.includes(objective.questId), 'objective quest_id ' + objective.questId + ' matches a seeded quest');
    }

    // --- rewards point at coins (102) and every quest has one ---------------
    // (id, quest_id, item_id, quantity) - all unquoted
    let rewardRe = /\(([0-9]+), ([0-9]+), 102, ([0-9]+)\)/g;
    let rewardRows = [];
    while((m = rewardRe.exec(questline)) !== null){
        rewardRows.push({questId: Number(m[2]), qty: Number(m[3])});
    }
    assert.strictEqual(rewardRows.length, 6, 'every quest has a coins reward');
    for(let row of rewardRows){
        assert.ok(questIds.includes(row.questId), 'reward quest_id ' + row.questId + ' matches a seeded quest');
        assert.ok(row.qty > 0, 'reward quantity is positive');
    }

    // --- the arc total XP levels a fresh player (T2.3 curve) ----------------
    // reward_exp is the 6th column: (id, 'code', 'label', 'description', object_id, reward_exp, 1)
    let xpRe = /\n    \(([0-9]+), '[a-z_]+', '[^']*',\s*'[^']*',\s*118,\s*([0-9]+),\s*1\)/g;
    let xpSum = 0;
    let xpCount = 0;
    while((m = xpRe.exec(questline)) !== null){
        xpSum += Number(m[2]);
        xpCount++;
    }
    assert.strictEqual(xpCount, 6, 'all 6 quests carry reward_exp');
    assert.ok(xpSum >= 79, 'arc XP (' + xpSum + ') reaches the level-2 threshold (79)');

    // --- questline is anchored to the capital quest board (object 118) ------
    assert.strictEqual((questline.match(/118, [0-9]+, 1\)/g) || []).length, 6, 'quests are anchored to quest board object 118');

    console.log('test-questline-content: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
