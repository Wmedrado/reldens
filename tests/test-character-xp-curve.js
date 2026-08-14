/**
 *
 * VibeCraft - test-character-xp-curve
 *
 * Validates the T2.3 character XP curve against the real @reldens/skills engine.
 * The migration (beta.48-character-xp-curve.sql) seeds a cumulative 1-100 curve
 * with required_experience = round(15 * level^2.4) and +2 atk / +8 hp per level.
 * This test rebuilds that curve in-memory and verifies the engine levels up at
 * the exact thresholds, applies the per-level modifiers, jumps multiple levels
 * on a big XP grant, and caps at level 100. No live server or database.
 *
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { LevelsSet, Level } = require('@reldens/skills');

const LEVELS = 100;
const K = 15;
const P = 2.4;

function curve(level)
{
    return 1 === level ? 0 : Math.round(K * Math.pow(level, P));
}

function makeModifier(key)
{
    return {
        apply(owner){ owner.stats[key] += 2; },
        revert(owner){ owner.stats[key] -= 2; }
    };
}

function buildLevels()
{
    let levels = {};
    for(let l = 1; l <= LEVELS; l++){
        levels[String(l)] = new Level({
            key: l,
            modifiers: [makeModifier('atk')],
            requiredExperience: curve(l)
        });
    }
    return levels;
}

function makeOwner()
{
    return {
        id: 7,
        stats: { atk: 100, hp: 100 },
        getPosition: () => ({x: 1, y: 1}),
        eventUniqueKey: () => 'owner7'
    };
}

async function makeLevelsSet(currentLevel, currentExp)
{
    let owner = makeOwner();
    let set = new LevelsSet({owner});
    set.setOwner({owner});
    await set.init({levels: buildLevels(), currentLevel, currentExp, autoFillRanges: false});
    return set;
}

async function main()
{
    // --- curve contract matches the migration -------------------------------
    assert.strictEqual(curve(2), 79, 'L2 requires 79 XP');
    assert.strictEqual(curve(10), 3768, 'L10 requires 3768 XP');
    assert.strictEqual(curve(50), 179316, 'L50 requires 179316 XP');
    assert.strictEqual(curve(100), 946436, 'L100 requires 946436 XP');
    for(let l = 2; l <= LEVELS; l++){
        assert.ok(curve(l) > curve(l - 1), 'curve is monotonic at L' + l);
    }

    // --- just below the L2 threshold: no level up ----------------------------
    let set = await makeLevelsSet(1, 0);
    await set.addExperience(78);
    assert.strictEqual(set.currentLevel, 1, '78 XP keeps level 1');
    assert.strictEqual(set.currentExp, 78, 'XP accumulates without leveling');

    // --- crossing the L2 threshold: level up + modifier ----------------------
    set = await makeLevelsSet(1, 0);
    await set.addExperience(79);
    assert.strictEqual(set.currentLevel, 2, '79 XP reaches level 2');
    assert.strictEqual(set.currentExp, 79, 'cumulative XP is kept after leveling');
    assert.strictEqual(set.owner.stats.atk, 102, 'level 2 applies the +2 atk modifier');

    // --- cumulative multi-level jump on a big grant --------------------------
    set = await makeLevelsSet(1, 0);
    await set.addExperience(3768);
    assert.strictEqual(set.currentLevel, 10, '3768 XP jumps straight to level 10');

    // --- resuming an existing character at a saved level/XP ------------------
    set = await makeLevelsSet(10, curve(10));
    await set.addExperience(1);
    assert.strictEqual(set.currentLevel, 10, 'no instant level up when resuming mid-level');

    // --- XP cap at max level -------------------------------------------------
    set = await makeLevelsSet(LEVELS, curve(LEVELS));
    await set.addExperience(1000000);
    assert.strictEqual(set.currentLevel, LEVELS, 'level is capped at 100');

    // --- the migration file matches the in-memory curve ----------------------
    let migration = fs.readFileSync(
        path.join(__dirname, '..', 'migrations/development/beta.48-character-xp-curve.sql'),
        'utf8'
    );
    let levelRows = (migration.match(/SELECT (\d+) AS lvl, '\1' AS lbl/g) || []).length;
    assert.strictEqual(levelRows, LEVELS, 'migration seeds one row per level');
    let modifierRows = (migration.match(/AS mod_key/g) || []).length;
    assert.strictEqual(modifierRows, LEVELS * 4, 'migration seeds 4 modifiers per level');

    console.log('test-character-xp-curve: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
