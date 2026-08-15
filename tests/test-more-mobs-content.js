/**
 *
 * VibeCraft - test-more-mobs-content
 *
 * Content-integrity test for the T3.7 farm mob extension
 * (beta.53-vibecraft-more-mobs.sql). Guards the two new creatures (kobold 404,
 * gnoll 405) carry a complete creature "ficha" under the beta.48 contract:
 * enemy object (class_type 7 + childObjectType 4), one sprite asset that exists
 * on disk, four directional animations, the full 10-stat block, one attack
 * skill, a respawn row on the shared spawn layer, a coins+XP reward, a valid
 * damage-type profile, and (for the gnoll) a drop-table link. Also cross-checks
 * no id collision with the beta.48 roster (400-403). Pure file parsing.
 *
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const MIG = path.join(__dirname, '..', 'migrations', 'development');
const SPRITES = path.join(__dirname, '..', 'theme', 'default', 'assets', 'custom', 'sprites');
// Collapse newlines + indentation so the multi-line object rows (title / private_params /
// client_params each on their own line) parse as a single record.
const read = (f) => fs.readFileSync(path.join(MIG, f), 'utf8').replace(/\s*\n\s*/g, ' ');

const sql = read('beta.53-vibecraft-more-mobs.sql');
const prev = read('beta.48-vibecraft-creatures.sql');

const VALID_DAMAGE_TYPES = ['crush', 'slash', 'stab', 'archery', 'magic'];
const STAT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// (id, 103, 'respawn-area-monsters', tile, 7, 'key', 'client_key', 'title', '{private}', '{client}', 1)
const OBJ_RE = /\(([0-9]+), 103, 'respawn-area-monsters', ([0-9]+), 7, '([^']*)', '([^']*)', '([^']*)', '([^']*)', '([^']*)', 1\)/g;
const ASSET_RE = /\(([0-9]+), ([0-9]+), 'spritesheet', '([^']*)', '([^']*)', '([^']*)'\)/g;
const ANIM_RE = /\(([0-9]+), ([0-9]+), '([^']*)', '([^']*)'\)/g;
const STAT_RE = /\(([0-9]+), ([0-9]+), ([0-9]+), ([0-9]+), ([0-9]+)\)/g;
const SKILL_RE = /\(([0-9]+), ([0-9]+), ([0-9]+), ([0-9]+)\)/g;
const RESPAWN_RE = /\(([0-9]+), ([0-9]+), ([0-9]+), ([0-9]+), '([^']*)'\)/g;
const REWARD_RE = /\(([0-9]+), ([0-9]+), ([0-9]+), NULL, ([0-9]+), ([0-9]+), ([0-9]+), 0, 0, 1\)/g;
const DT_RE = /\(([0-9]+), ([0-9]+), '([^']*)', (-?[0-9]+), NULL\)/g;
const DROP_RE = /\(([0-9]+), ([0-9]+), ([0-9]+)\)/g;

function extractAll(re, text)
{
    let rows = [];
    let m;
    while((m = re.exec(text)) !== null){
        rows.push(m);
    }
    return rows;
}

async function main()
{
    const objects = extractAll(OBJ_RE, sql).map((m) => ({
        id: Number(m[1]),
        tile: Number(m[2]),
        key: m[3],
        privateParams: JSON.parse(m[6])
    }));
    const assets = extractAll(ASSET_RE, sql).map((m) => ({id: Number(m[2]), file: m[4]}));
    const anims = extractAll(ANIM_RE, sql);
    const stats = extractAll(STAT_RE, sql);
    const skills = extractAll(SKILL_RE, sql);
    const respawns = extractAll(RESPAWN_RE, sql);
    const rewards = extractAll(REWARD_RE, sql);
    const dts = extractAll(DT_RE, sql);
    const drops = extractAll(DROP_RE, sql);

    // --- two new enemies, correct type, no collision with beta.48 -------------
    assert.strictEqual(objects.length, 2, 'two new mobs');
    const ids = objects.map((o) => o.id).sort();
    assert.deepStrictEqual(ids, [404, 405], 'new mobs are 404 and 405');
    const prevObjs = new Set(extractAll(OBJ_RE, prev).map((m) => Number(m[1])));
    for(let id of ids){
        assert.ok(!prevObjs.has(id), 'mob ' + id + ' does not collide with beta.48 roster');
        assert.ok(!prevObjs.has(id), '');
    }

    const assetByObj = {};
    for(let a of assets){
        assetByObj[a.id] = a.file;
    }

    for(let o of objects){
        // enemy wiring
        assert.strictEqual(o.privateParams.childObjectType, 4, 'mob ' + o.id + ' is childObjectType 4');
        assert.strictEqual(o.privateParams.shouldRespawn, true, 'mob ' + o.id + ' shouldRespawn');
        assert.strictEqual(o.privateParams.isAggressive, true, 'mob ' + o.id + ' is aggressive');

        // sprite asset exists on disk
        let file = assetByObj[o.id];
        assert.ok(file, 'mob ' + o.id + ' has a sprite asset');
        assert.ok(fs.existsSync(path.join(SPRITES, file)), 'mob ' + o.id + ' sprite exists: ' + file);

        // four directional animations
        let myAnims = anims.filter((m) => Number(m[2]) === o.id);
        assert.strictEqual(myAnims.length, 4, 'mob ' + o.id + ' has 4 animations');
        for(let d of ['down', 'left', 'right', 'up']){
            assert.ok(myAnims.some((m) => m[3].endsWith('_' + d)), 'mob ' + o.id + ' has ' + d + ' animation');
        }

        // full 10-stat block
        let myStats = stats.filter((m) => Number(m[2]) === o.id);
        let statIds = myStats.map((m) => Number(m[3])).sort((a, b) => a - b);
        assert.deepStrictEqual(statIds, STAT_IDS, 'mob ' + o.id + ' has all 10 stats');
        for(let s of myStats){
            assert.strictEqual(Number(s[4]), Number(s[5]), 'mob ' + o.id + ' stat ' + s[3] + ' base==value');
        }

        // one attack skill
        let mySkills = skills.filter((m) => Number(m[2]) === o.id);
        assert.strictEqual(mySkills.length, 1, 'mob ' + o.id + ' has 1 skill');

        // one respawn on the shared layer
        let myRespawn = respawns.filter((m) => Number(m[2]) === o.id);
        assert.strictEqual(myRespawn.length, 1, 'mob ' + o.id + ' has 1 respawn');
        assert.strictEqual(myRespawn[0][5], 'respawn-area-monsters', 'mob ' + o.id + ' respawns on the shared layer');

        // one reward with coins + positive XP
        let myReward = rewards.filter((m) => Number(m[2]) === o.id);
        assert.strictEqual(myReward.length, 1, 'mob ' + o.id + ' has 1 reward');
        assert.strictEqual(Number(myReward[0][3]), 102, 'mob ' + o.id + ' rewards coins');
        assert.ok(Number(myReward[0][4]) > 0, 'mob ' + o.id + ' reward XP is positive');

        // at least one damage-type profile
        let myDts = dts.filter((m) => Number(m[2]) === o.id);
        assert.ok(myDts.length >= 1, 'mob ' + o.id + ' has a damage-type profile');
        for(let d of myDts){
            assert.ok(VALID_DAMAGE_TYPES.includes(d[3]), 'mob ' + o.id + ' damage type is valid: ' + d[3]);
            assert.notStrictEqual(Number(d[4]), 0, 'mob ' + o.id + ' damage type has non-neutral defense');
        }
    }

    // gnoll (405) links a shared drop table; kobold (404) is coins-only
    let dropObjs = drops.map((m) => Number(m[2]));
    assert.ok(dropObjs.includes(405), 'gnoll links a drop table');
    assert.ok(!dropObjs.includes(404), 'kobold is coins-only');

    console.log('test-more-mobs-content: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
