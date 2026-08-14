/**
 *
 * Reldens - Process Dungeon Crawl Stone Soup Assets
 *
 * Converts DCSS single-frame monster and item PNGs into the Reldens runtime
 * format inside theme/default/assets/custom/sprites/:
 *   - monster spritesheets: 12-frame walk cycles (down 0-2, left 3-5,
 *     right 6-8, up 9-11) built from a single 32x32 frame with a 1px
 *     walk-wiggle offset, output 384x32
 *   - item icons: copied as-is, resized to exactly 32x32
 *   - dungeon props: a few decorative tiles from dungeon/doors, traps and
 *     statues, output 32x32 as prop_<name>.png
 *
 * Missing optional sources are logged and skipped, never thrown.
 * A machine-readable manifest is written to dcss-manifest.json.
 *
 * Run: node bin/process-dcss.js
 *
 */

const { FileHandler } = require('@reldens/server-utils');
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');

const DCSS_ROOT = process.env.GAME_DCSS_ROOT || 'F:/Assets/Dungeon Crawl Stone Soup Full';
const THEME_ROOT = path.resolve(__dirname, '..', 'theme', 'default');
const SPRITES_DIR = path.join(THEME_ROOT, 'assets', 'custom', 'sprites');

const FRAME_SIZE = 32;
const FRAME_COUNT = 12;
const SHEET_WIDTH = FRAME_SIZE * FRAME_COUNT;

// DCSS monsters to convert, key -> source relative to DCSS_ROOT:
const MONSTERS = {
    goblin: 'monster/goblin_new.png',
    kobold: 'monster/kobold_new.png',
    gnoll: 'monster/gnoll_new.png',
    hobgoblin: 'monster/hobgoblin_new.png',
    orc: 'monster/orc_new.png',
    jelly: 'monster/jelly.png',
    rat: null, // resolved dynamically below
    human: 'monster/human_new.png'
};

// DCSS items to copy, key -> source relative to DCSS_ROOT (first existing
// source wins, useful for fallbacks):
const ITEMS = {
    wooden_sword: ['item/weapon/ancient_sword.png'],
    battle_axe: ['item/weapon/battle_axe_1.png'],
    axe: ['item/weapon/axe.png'],
    health_potion: ['item/potion/emerald.png'],
    magic_potion: ['item/potion/blue.png', 'item/potion/cyan_new.png'],
    coins: ['item/gold/gold_pile.png'],
    key: ['item/misc/key.png'],
    crystal_shard: ['item/misc/misc_crystal_new.png'],
    apple: ['item/food/apple.png'],
    cheese: ['item/food/cheese.png']
};

// DCSS dungeon props, key -> source relative to DCSS_ROOT:
const PROPS = {
    prop_closed_door: 'dungeon/doors/closed_door.png',
    prop_runed_door: 'dungeon/doors/runed_door.png',
    prop_gas_trap: 'dungeon/traps/gas_trap.png',
    prop_statue: 'dungeon/statues/statue_archer.png'
};

// Relative walk directions, same order as process-assets.js (down, left,
// right, up). Each direction yields 3 frames: base, 1px offset, base.
const DIRECTIONS = [
    {x: 0, y: 1},   // down, frames 0-2
    {x: -1, y: 0},  // left, frames 3-5
    {x: 1, y: 0},   // right, frames 6-8
    {x: 0, y: -1}   // up, frames 9-11
];

function dcssPath(relative)
{
    return path.join(DCSS_ROOT, relative);
}

function outFile(key)
{
    return path.join(SPRITES_DIR, key + '.png');
}

function findExisting(sources)
{
    for(let source of sources){
        let file = dcssPath(source);
        if(fs.existsSync(file)){
            return {source, file};
        }
    }
    return null;
}

/**
 * Build a 12-frame walk spritesheet from a single source frame.
 * Same layout and 1px walk-wiggle trick as process-assets.js buildAvatarSprite.
 */
async function buildWalkSheet(sourceBuffer)
{
    let base = await sharp(sourceBuffer)
        .resize(FRAME_SIZE, FRAME_SIZE, {kernel: 'nearest'})
        .png()
        .toBuffer();
    let frames = [];
    for(let dir of DIRECTIONS){
        let stepped = await sharp({
            create: {width: FRAME_SIZE, height: FRAME_SIZE, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}
        }).composite([
            {input: base, left: dir.x, top: dir.y}
        ]).png().toBuffer();
        frames.push(base);
        frames.push(stepped);
        frames.push(base);
    }
    return sharp({
        create: {width: SHEET_WIDTH, height: FRAME_SIZE, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}
    }).composite(
        frames.map((frame, i) => ({input: frame, left: i * FRAME_SIZE, top: 0}))
    ).png().toBuffer();
}

/**
 * Resolve a rat-like monster source. DCSS has no rat.png; look for any
 * monster file with 'rat' in the name (labrat_unseen.png). If nothing
 * matches, fall back to kobold_new.png with a warning.
 */
function resolveRatSource()
{
    let direct = dcssPath('monster/rat.png');
    if(fs.existsSync(direct)){
        return 'monster/rat.png';
    }
    let monsterDir = path.join(DCSS_ROOT, 'monster');
    if(fs.existsSync(monsterDir)){
        let names = fs.readdirSync(monsterDir).filter((name) => {
            return name.endsWith('.png') && name.toLowerCase().includes('rat');
        });
        // skip hydrataur: it only matches because its name ends with 'rat':
        names = names.filter((name) => {
            return !name.toLowerCase().includes('hydrataur');
        });
        let match = names.find((name) => name.toLowerCase().startsWith('labrat'));
        if(!match){
            match = names[0];
        }
        if(match){
            return 'monster/' + match;
        }
    }
    console.log('WARN: no rat monster found in DCSS, using kobold_new.png for rat');
    return 'monster/kobold_new.png';
}

async function verifySize(file, expectedWidth, expectedHeight)
{
    let meta = await sharp(file).metadata();
    if(meta.width !== expectedWidth || meta.height !== expectedHeight){
        console.error('FAIL: ' + file + ' is ' + meta.width + 'x' + meta.height + ', expected ' + expectedWidth + 'x' + expectedHeight);
        return false;
    }
    return true;
}

async function processMonsters()
{
    let manifest = {};
    for(let key of Object.keys(MONSTERS)){
        let source = MONSTERS[key];
        if(source === null){
            source = resolveRatSource();
        }
        let file = dcssPath(source);
        if(!fs.existsSync(file)){
            console.log('WARN: missing monster source ' + source + ', skipping ' + key);
            continue;
        }
        let sheet = await buildWalkSheet(file);
        let target = outFile(key);
        fs.writeFileSync(target, sheet);
        let ok = await verifySize(target, SHEET_WIDTH, FRAME_SIZE);
        if(!ok){
            continue;
        }
        manifest[key] = path.basename(target);
        console.log('monster:', key, '->', source, '->', target);
    }
    return manifest;
}

async function processItems(initialFiles)
{
    let manifest = {};
    for(let key of Object.keys(ITEMS)){
        let found = findExisting(ITEMS[key]);
        if(!found){
            console.log('WARN: no item source found for ' + key + ' in ' + ITEMS[key].join(', ') + ', skipping');
            continue;
        }
        if(ITEMS[key][0] !== found.source){
            console.log('NOTE: ' + key + ' source ' + ITEMS[key][0] + ' missing, using fallback ' + found.source);
        }
        let targetKey = key;
        let target = outFile(targetKey);
        // never overwrite pre-existing sample sprites (detected before any
        // cleanup); prefix with dcss_ instead:
        if(initialFiles.has(targetKey + '.png')){
            targetKey = 'dcss_' + key;
            target = outFile(targetKey);
            console.log('NOTE: ' + key + '.png already exists, writing ' + targetKey + '.png');
        }
        let icon = await sharp(found.file)
            .resize(FRAME_SIZE, FRAME_SIZE, {kernel: 'nearest'})
            .png()
            .toBuffer();
        fs.writeFileSync(target, icon);
        let ok = await verifySize(target, FRAME_SIZE, FRAME_SIZE);
        if(!ok){
            continue;
        }
        manifest[targetKey] = path.basename(target);
        console.log('item:', targetKey, '<-', found.source, '->', target);
    }
    return manifest;
}

async function processProps()
{
    let manifest = {};
    for(let key of Object.keys(PROPS)){
        let source = PROPS[key];
        let file = dcssPath(source);
        if(!fs.existsSync(file)){
            console.log('WARN: missing prop source ' + source + ', skipping ' + key);
            continue;
        }
        let target = outFile(key);
        let tile = await sharp(file)
            .resize(FRAME_SIZE, FRAME_SIZE, {kernel: 'nearest'})
            .png()
            .toBuffer();
        fs.writeFileSync(target, tile);
        let ok = await verifySize(target, FRAME_SIZE, FRAME_SIZE);
        if(!ok){
            continue;
        }
        manifest[key] = path.basename(target);
        console.log('prop:', key, '->', source, '->', target);
    }
    return manifest;
}

/**
 * Delete the outputs a previous run recorded in the manifest, so a re-run is
 * idempotent and never touches pre-existing sample sprites. Files owned by
 * this script are exactly those listed in the manifest; everything else in
 * sprites/ belongs to other pipelines and is left alone.
 */
function cleanupGeneratedFiles()
{
    let manifestFile = path.join(SPRITES_DIR, 'dcss-manifest.json');
    if(!fs.existsSync(manifestFile)){
        return;
    }
    let previous = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    let owned = new Set();
    for(let group of ['monsters', 'items', 'props']){
        let map = previous[group];
        if(!map){
            continue;
        }
        for(let key of Object.keys(map)){
            owned.add(map[key]);
        }
    }
    for(let name of owned){
        let file = path.join(SPRITES_DIR, name);
        if(fs.existsSync(file)){
            fs.unlinkSync(file);
            console.log('cleanup:', file);
        }
    }
    fs.unlinkSync(manifestFile);
    console.log('cleanup:', manifestFile);
}

async function main()
{
    FileHandler.createFolder(SPRITES_DIR);
    cleanupGeneratedFiles();
    // snapshot what exists after cleanup: only pre-existing sample sprites and
    // other pipelines' files remain, never files this script generated before:
    let initialFiles = new Set(fs.readdirSync(SPRITES_DIR));
    let monsters = await processMonsters();
    let items = await processItems(initialFiles);
    let props = await processProps();
    let manifest = {monsters, items, props};
    let manifestFile = path.join(SPRITES_DIR, 'dcss-manifest.json');
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    console.log('manifest ->', manifestFile);
    console.log('DONE');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
