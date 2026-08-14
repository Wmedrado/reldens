/**
 *
 * Reldens - Process Assets
 *
 * Converts Kenney and Dungeon Crawl assets into the Reldens runtime format:
 *   - avatar spritesheets: 12-frame walk cycles (down 0-2, left 3-5, right 6-8,
 *     up 9-11) scaled to 32x32 px, written to theme/default/assets/custom/sprites/
 *   - dungeon tileset: Kenney roguelike-caves-dungeons scaled 2x to 32px tiles,
 *     written to theme/default/assets/maps/
 *   - demo map: a Tiled JSON map using the dungeon tileset
 *
 * Run: node bin/process-assets.js
 *
 */

const { FileHandler } = require('@reldens/server-utils');
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');

const ASSETS_ROOT = process.env.GAME_ASSETS_ROOT || 'F:/Assets';
const THEME_ROOT = path.resolve(__dirname, '..', 'theme', 'default');
const SPRITES_DIR = path.join(THEME_ROOT, 'assets', 'custom', 'sprites');
const MAPS_DIR = path.join(THEME_ROOT, 'assets', 'maps');

const KENNEY_CHARS_SHEET = path.join(
    ASSETS_ROOT, 'Kenney', 'extracted', 'kenney_roguelike-characters', 'Spritesheet',
    'roguelikeChar_transparent.png'
);
const KENNEY_DUNGEON_SHEET = path.join(
    ASSETS_ROOT, 'Kenney', 'extracted', 'kenney_roguelike-caves-dungeons', 'Spritesheet',
    'roguelikeDungeon_transparent.png'
);

// Kenney 16px tiles with 1px margin:
const TILE = 16;
const MARGIN = 1;
const STEP = TILE + MARGIN;

// Avatar columns to use (non-empty humanoid characters found by pixel scan):
const AVATAR_COLUMNS = [6, 7, 8, 9, 10, 11, 14, 33];
const AVATAR_NAMES = ['hero-1', 'hero-2', 'hero-3', 'hero-4', 'hero-5', 'hero-6', 'ranger-1', 'mage-1'];

function tileRegion(c, r)
{
    return {
        left: c * STEP + MARGIN,
        top: r * STEP + MARGIN,
        width: TILE,
        height: TILE
    };
}

async function extractTile(sheet, c, r)
{
    let region = tileRegion(c, r);
    return sharp(sheet).extract(region).toBuffer();
}

/**
 * Build a 12-frame avatar spritesheet from a single 16x16 character tile.
 * Reldens frame layout (config client/players/animations/defaultFrames):
 *   down frames 0-2, left frames 3-5, right frames 6-8, up frames 9-11.
 * Each direction gets 3 frames: base, offset (walking step), base. The offset
 * gives a subtle pixel-art walk wiggle from a single-frame source. One row of
 * 12 frames: 32 x 12 = 384 wide, 32 tall.
 */
async function buildAvatarSprite(originalTile)
{
    let base = await sharp(originalTile).resize(32, 32, {kernel: 'nearest'}).toBuffer();
    let directions = [
        {x: 0, y: 1},   // down
        {x: -1, y: 0},  // left
        {x: 1, y: 0},   // right
        {x: 0, y: -1}   // up
    ];
    let frames = [];
    for(let dir of directions){
        let stepped = await sharp({
            create: {width: 32, height: 32, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}
        }).composite([
            {input: base, left: dir.x, top: dir.y}
        ]).png().toBuffer();
        frames.push(base);
        frames.push(stepped);
        frames.push(base);
    }
    let sheet = await sharp({
        create: {width: 32 * 12, height: 32, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}
    }).composite(
        frames.map((frame, i) => ({input: frame, left: i * 32, top: 0}))
    ).png().toBuffer();
    return sheet;
}

async function processAvatars()
{
    for(let i = 0; i < AVATAR_COLUMNS.length; i++){
        let col = AVATAR_COLUMNS[i];
        let name = AVATAR_NAMES[i];
        // row 0 holds the base character (verified by pixel scan):
        let tile = await extractTile(KENNEY_CHARS_SHEET, col, 0);
        let sheet = await buildAvatarSprite(tile);
        let outFile = path.join(SPRITES_DIR, name + '.png');
        fs.writeFileSync(outFile, sheet);
        console.log('avatar:', name, '->', outFile);
    }
    // also write the default fallback avatar (col 6) as player-base.png:
    let baseTile = await extractTile(KENNEY_CHARS_SHEET, AVATAR_COLUMNS[0], 0);
    let baseSheet = await buildAvatarSprite(baseTile);
    let baseOut = path.join(SPRITES_DIR, 'player-base.png');
    fs.writeFileSync(baseOut, baseSheet);
    console.log('fallback avatar ->', baseOut);
}

async function processDungeonTileset()
{
    let meta = await sharp(KENNEY_DUNGEON_SHEET).metadata();
    let cols = Math.round((meta.width + MARGIN) / STEP);
    let rows = Math.round((meta.height + MARGIN) / STEP);
    console.log('dungeon sheet:', meta.width, 'x', meta.height, '=', cols, 'x', rows, 'tiles');
    // scale 2x (16 -> 32 px). The 1px margin scales to 2px.
    let scaled = await sharp(KENNEY_DUNGEON_SHEET).resize(meta.width * 2, meta.height * 2, {kernel: 'nearest'}).png().toBuffer();
    let outFile = path.join(MAPS_DIR, 'kenney-dungeon.png');
    fs.writeFileSync(outFile, scaled);
    console.log('dungeon tileset ->', outFile, '(' + (meta.width * 2) + 'x' + (meta.height * 2) + ')');
    return {cols, rows};
}

async function generateDemoMap()
{
    // 30x20 demo map, dungeon tileset, ground + walls + collisions + change-points.
    let map = {
        backgroundcolor: '#1a1a1a',
        compressionlevel: 0,
        height: 20,
        infinite: false,
        layers: [
            {
                data: [],
                height: 20,
                id: 1,
                name: 'ground',
                opacity: 1,
                type: 'tilelayer',
                visible: true,
                width: 30,
                x: 0,
                y: 0
            },
            {
                data: [],
                height: 20,
                id: 2,
                name: 'ground-collisions',
                opacity: 1,
                type: 'tilelayer',
                visible: true,
                width: 30,
                x: 0,
                y: 0
            },
            {
                data: [],
                height: 20,
                id: 3,
                name: 'change-points',
                opacity: 1,
                type: 'tilelayer',
                visible: true,
                width: 30,
                x: 0,
                y: 0
            }
        ],
        nextlayerid: 4,
        nextobjectid: 1,
        orientation: 'orthogonal',
        renderorder: 'right-down',
        tiledversion: '1.8.4',
        tileheight: 32,
        tilesets: [
            {
                columns: 29,
                firstgid: 1,
                image: 'kenney-dungeon.png',
                imageheight: 610,
                imagewidth: 984,
                margin: 2,
                name: 'kenney-dungeon',
                spacing: 0,
                tilecount: 522,
                tileheight: 32,
                tilewidth: 32
            }
        ],
        tilewidth: 32,
        type: 'map',
        version: '1.8',
        width: 30
    };
    let size = 30 * 20;
    let ground = new Array(size).fill(0);
    let collisions = new Array(size).fill(0);
    let change = new Array(size).fill(0);
    // floor tile 1 everywhere, walls (tile 2) on the border:
    for(let y = 0; y < 20; y++){
        for(let x = 0; x < 30; x++){
            let i = y * 30 + x;
            ground[i] = 1;
            if(x === 0 || x === 29 || y === 0 || y === 19){
                collisions[i] = 2;
            }
        }
    }
    // a couple of interior pillars:
    collisions[6 * 30 + 6] = 2;
    collisions[6 * 30 + 7] = 2;
    collisions[13 * 30 + 22] = 2;
    collisions[13 * 30 + 23] = 2;
    map.layers[0].data = ground;
    map.layers[1].data = collisions;
    map.layers[2].data = change;
    let outFile = path.join(MAPS_DIR, 'vibecraft-demo.json');
    fs.writeFileSync(outFile, JSON.stringify(map));
    console.log('demo map ->', outFile);
}

async function main()
{
    FileHandler.createFolder(SPRITES_DIR);
    FileHandler.createFolder(MAPS_DIR);
    await processAvatars();
    await processDungeonTileset();
    await generateDemoMap();
    console.log('DONE');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
