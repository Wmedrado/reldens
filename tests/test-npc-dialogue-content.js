/**
 *
 * VibeCraft - test-npc-dialogue-content
 *
 * Content-integrity test for the T3.4 NPC dialogue migration
 * (beta.52-npc-dialogue.sql). The capital NPCs used to speak English one-liners
 * while the signs and wiki are PT-BR (VibeCraft). This migration REPLACEs only
 * the client_params (content + option labels) of the 5 existing capital NPCs;
 * the functional fields (option value/key/icon) must be preserved so the action
 * wiring (buy/sell, blacksmith weapons, healer HP/MP) keeps working. The test
 * cross-checks: 5 NPCs updated, PT-BR non-empty content, option labels
 * translated but values/keys untouched, and no QA-forbidden characters (em/en
 * dash, emoji, apostrophe) in the strings. Pure file parsing - no live server.
 *
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(
    path.join(__dirname, '..', 'migrations', 'development', 'beta.52-npc-dialogue.sql'),
    'utf8'
);

// (id, 101, 'house-collisions-over-player', tile, class_type, class_key, client_key, title, private, client_params, enabled)
const NPC_RE = /\(([0-9]+), 101, 'house-collisions-over-player', [0-9]+, [0-9]+, '([^']*)', '([^']*)', '([^']*)', '[^']*', '([^']*)', [01]\)/g;

function extractNpcs()
{
    let npcs = [];
    let m;
    while((m = NPC_RE.exec(sql)) !== null){
        npcs.push({
            id: Number(m[1]),
            classKey: m[2],
            clientKey: m[3],
            title: m[4],
            clientParams: JSON.parse(m[5])
        });
    }
    return npcs;
}

// forbidden characters per the QA copy guards (em/en dash, emoji, apostrophe).
const FORBIDDEN = /[–—―\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}☀-➿️']/u;

// English originals that must be gone (labels were translated to PT-BR).
const ENGLISH_LABELS = ['Buy', 'Sell', 'Axe', 'Spear', 'Sure!', 'No, thank you.', 'Heal HP', 'Need some MP'];

async function main()
{
    const npcs = extractNpcs();
    const byId = {};
    for(let n of npcs){
        byId[n.id] = n;
    }

    // --- exactly the 5 capital NPCs are updated ------------------------------
    assert.strictEqual(npcs.length, 5, 'migration updates 5 capital NPCs');
    for(let id of [112, 113, 114, 115, 116]){
        assert.ok(byId[id], 'NPC ' + id + ' is updated');
    }

    // --- every NPC has non-empty PT-BR content and title ----------------------
    for(let n of npcs){
        assert.ok(n.title.length > 0, 'NPC ' + n.id + ' has a title');
        let content = n.clientParams.content;
        assert.strictEqual(typeof content, 'string', 'NPC ' + n.id + ' has content');
        assert.ok(content.trim().length > 0, 'NPC ' + n.id + ' content is non-empty');
        assert.ok(!FORBIDDEN.test(content), 'NPC ' + n.id + ' content has no forbidden char: ' + content);
        assert.ok(!FORBIDDEN.test(n.title), 'NPC ' + n.id + ' title has no forbidden char');
        assert.ok(!/[A-Z][a-z]+ (there|hello|welcome|would)/i.test(content), 'NPC ' + n.id + ' content is not English');
    }

    // --- option labels translated but value/key wiring preserved --------------
    let validateOptions = (id, expectedValues) => {
        let options = byId[id].clientParams.options || {};
        let values = Object.values(options).map((o) => o.value);
        for(let key of Object.keys(options)){
            let opt = options[key];
            assert.ok(opt.label && opt.label.length > 0, 'NPC ' + id + ' option "' + key + '" has a label');
            assert.ok(!ENGLISH_LABELS.includes(opt.label), 'NPC ' + id + ' option label translated: ' + opt.label);
            assert.ok(opt.value !== undefined, 'NPC ' + id + ' option "' + key + '" has a value');
        }
        assert.deepStrictEqual(values.sort(), [...expectedValues].sort(), 'NPC ' + id + ' option values preserved');
    };

    validateOptions(112, ['buy', 'sell']);
    validateOptions(113, [1, 2]);
    validateOptions(114, [1, 2]);
    validateOptions(115, [1, 2, 3]);

    // --- blacksmith keeps its weapon key + icon (function wiring) -------------
    let blacksmith = byId[113].clientParams.options;
    assert.ok(blacksmith[1] && blacksmith[1].key === 'axe' && blacksmith[1].icon === 'axe', 'axe option keeps key+icon');
    assert.ok(blacksmith[2] && blacksmith[2].key === 'spear' && blacksmith[2].icon === 'spear', 'spear option keeps key+icon');

    // --- banker has content and no stale English options ----------------------
    assert.ok(byId[116].clientParams.ui === true, 'banker keeps ui flag');

    console.log('test-npc-dialogue-content: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
