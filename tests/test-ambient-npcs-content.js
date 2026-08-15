/**
 *
 * VibeCraft - test-ambient-npcs-content
 *
 * Content-integrity test for the T3.4 farm ambient NPC migration
 * (beta.54-ambient-npcs.sql). The farm (room 103) had mobs, gathering nodes,
 * farm plots and a sign but no living NPCs; this migration adds two flavor
 * villagers (Fazendeiro 406, Camponesa 407) on the "ground" layer with PT-BR
 * dialogue and a close button. The test cross-checks: 2 NPCs added with no id
 * collision against the existing farm roster (320-332 + mobs 400-405), the
 * people sprite assets exist on disk with the 52x71 frame contract, and the
 * content/title are non-empty PT-BR with no QA-forbidden characters (em/en
 * dash, emoji, apostrophe). Pure file parsing - no live server.
 *
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Collapse newlines + indentation so the multi-line object rows (title /
// private_params / client_params each on their own line) parse as one record.
const sql = fs.readFileSync(
    path.join(__dirname, '..', 'migrations', 'development', 'beta.54-ambient-npcs.sql'),
    'utf8'
).replace(/\s*\n\s*/g, ' ');

// (id, 103, 'ground', tile, 3, 'class_key', 'client_key', 'title', '{private}', '{client}', 1)
const NPC_RE = /\(([0-9]+), 103, 'ground', [0-9]+, 3, '([^']*)', '([^']*)', '([^']*)', '[^']*', '([^']*)', 1\)/g;

// (object_asset_id, object_id, 'spritesheet', 'asset_key', 'asset_file', '{extra}')
const ASSET_RE = /\(([0-9]+), ([0-9]+), 'spritesheet', '([^']*)', '([^']*)', '([^']*)'\)/g;

const SPRITES = path.join(__dirname, '..', 'theme', 'default', 'assets', 'custom', 'sprites');

// forbidden characters per the QA copy guards (em/en dash, emoji, apostrophe).
const FORBIDDEN = /[–—―\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}☀-➿️']/u;

// existing farm object ids (320-332 + mobs 400-405) that must not collide.
const FARM_IDS = [320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332,
    400, 401, 402, 403, 404, 405];

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
    const npcs = extractAll(NPC_RE, sql).map((m) => ({
        id: Number(m[1]),
        classKey: m[2],
        clientKey: m[3],
        title: m[4],
        clientParams: JSON.parse(m[5])
    }));
    const assets = extractAll(ASSET_RE, sql).map((m) => ({
        assetId: Number(m[1]),
        objectId: Number(m[2]),
        assetKey: m[3],
        file: m[4],
        extraParams: JSON.parse(m[5])
    }));

    // --- exactly two ambient NPCs, correct ids, no farm collision ------------
    assert.strictEqual(npcs.length, 2, 'migration adds 2 ambient NPCs');
    const ids = npcs.map((n) => n.id).sort();
    assert.deepStrictEqual(ids, [406, 407], 'ambient NPCs are 406 and 407');
    for(let id of ids){
        assert.ok(!FARM_IDS.includes(id), 'NPC ' + id + ' does not collide with farm roster');
    }

    const byId = {};
    for(let n of npcs){
        byId[n.id] = n;
    }

    // --- every NPC has a people sprite on disk with the 52x71 contract -------
    const assetByObj = {};
    for(let a of assets){
        assetByObj[a.objectId] = a;
        assert.strictEqual(a.extraParams.frameWidth, 52, 'asset ' + a.objectId + ' frameWidth 52');
        assert.strictEqual(a.extraParams.frameHeight, 71, 'asset ' + a.objectId + ' frameHeight 71');
        assert.ok(fs.existsSync(path.join(SPRITES, a.file)), 'sprite exists: ' + a.file);
    }
    assert.strictEqual(Object.keys(assetByObj).length, 2, '2 assets wired to the 2 NPCs');
    for(let id of ids){
        assert.ok(assetByObj[id], 'NPC ' + id + ' has a sprite asset');
        assert.strictEqual(assetByObj[id].assetKey, byId[id].clientKey, 'NPC ' + id + ' assetKey matches client_key');
    }

    // --- non-empty PT-BR title and content, no forbidden chars ---------------
    for(let n of npcs){
        assert.ok(n.title.length > 0, 'NPC ' + n.id + ' has a title');
        assert.ok(!FORBIDDEN.test(n.title), 'NPC ' + n.id + ' title has no forbidden char');

        let content = n.clientParams.content;
        assert.strictEqual(typeof content, 'string', 'NPC ' + n.id + ' has content');
        assert.ok(content.trim().length > 0, 'NPC ' + n.id + ' content is non-empty');
        assert.ok(!FORBIDDEN.test(content), 'NPC ' + n.id + ' content has no forbidden char');
        assert.ok(!/[A-Z][a-z]+ (there|hello|welcome|would)/i.test(content), 'NPC ' + n.id + ' content is not English');

        assert.strictEqual(n.clientParams.ui, true, 'NPC ' + n.id + ' has close button (ui:true)');
        assert.ok(!n.clientParams.options, 'NPC ' + n.id + ' is flavor-only (no options)');
    }

    console.log('test-ambient-npcs-content: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
