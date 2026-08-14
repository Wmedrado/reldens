/**
 *
 * Reldens - test-professions
 *
 * Standalone unit tests for the professions (per-skill leveling) module.
 * Uses an in-memory fake repository, so no database is needed.
 *
 */

const assert = require('assert');
const { ProfessionsManager } = require('../lib/professions/server/professions-manager');
const { GATHERING_SKILL_BY_CODE, PROFESSION_SKILL_KEYS } = require('../lib/professions/constants');

function createFakeRepo()
{
    let rows = [];
    let nextId = 1;
    return {
        rows,
        async loadBy(field, fieldValue)
        {
            return rows.filter(r => r[field] === fieldValue);
        },
        async create(data)
        {
            let row = Object.assign({id: nextId++}, data);
            rows.push(row);
            return row;
        },
        async updateById(id, data)
        {
            let row = rows.find(r => r.id === id);
            if(row){
                Object.assign(row, data);
                return row;
            }
            return null;
        }
    };
}

function createManager()
{
    let manager = new ProfessionsManager({dataServer: {getEntity: () => createFakeRepo()}});
    return manager;
}

async function main()
{
    let manager = createManager();

    // curve is monotonic:
    assert.strictEqual(manager.expRequiredForLevel(1), 0);
    assert.ok(manager.expRequiredForLevel(2) > manager.expRequiredForLevel(1));
    assert.strictEqual(manager.getLevelFromExp(0), 1);
    assert.strictEqual(manager.getLevelFromExp(manager.expRequiredForLevel(2) - 1), 1);
    assert.strictEqual(manager.getLevelFromExp(manager.expRequiredForLevel(2)), 2);

    // granting XP creates a record and levels up at thresholds:
    let player = {player_id: 1};
    let first = await manager.addExperience(player, 'farming', manager.xpBase);
    assert.strictEqual(first.newLevel, 2);
    assert.strictEqual(first.levelUp, true);

    // second grant accumulates and keeps level:
    let second = await manager.addExperience(player, 'farming', 10);
    assert.strictEqual(second.previousLevel, 2);
    assert.strictEqual(second.levelUp, false);

    // no-op on zero/negative:
    let zero = await manager.addExperience(player, 'woodcutting', 0);
    assert.strictEqual(zero, false);

    // skill keys are the expected set:
    assert.ok(PROFESSION_SKILL_KEYS.includes('farming'));
    assert.ok(PROFESSION_SKILL_KEYS.includes('woodcutting'));

    // resource code mapping:
    assert.strictEqual(GATHERING_SKILL_BY_CODE['tree'], 'woodcutting');
    assert.strictEqual(GATHERING_SKILL_BY_CODE['rock'], 'mining');
    assert.strictEqual(GATHERING_SKILL_BY_CODE['fish'], 'fishing');

    // getLevel fallback:
    let level = await manager.getLevel(999, 'mining');
    assert.strictEqual(level, 1);

    console.log('test-professions: all tests passed');
    process.exit(0);
}

main().catch((error) => {
    console.error('test-professions FAILED:', error.message);
    process.exit(1);
});
