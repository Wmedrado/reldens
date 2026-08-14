/**
 *
 * Capital Builder - collaborative map editor (claudecraft-adapted)
 *
 * Real-time map building for Reldens. Runs standalone on port 4310.
 * Shared state: the map JSON lives in theme/default/assets/maps (same files
 * the game loads). WebSocket channel broadcasts ops live to every open tab
 * (human editor + AI agent via /api/op). Debounced autosave + explicit save.
 *
 * claudecraft adaptations:
 *   - net.ts  -> single HTTP surface below (/api/*)
 *   - playtest.ts -> "Jogar" button jumps into the game at the saved room
 *   - WYSIWYG -> /render endpoint composes the real tileset into a PNG
 *
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const sharp = require('sharp');
const { WebSocketServer, WebSocket } = require('ws');

const ROOT = path.resolve(__dirname, '../..');
const MAPS_DIR = path.join(ROOT, 'theme/default/assets/maps');
const DIST_MAPS_DIR = path.join(ROOT, 'dist/assets/maps');
const ASSETS_ROOT = path.join(ROOT, 'assets-cc0');
const SPRITES_DIR = path.join(ROOT, 'theme/default/assets/custom/sprites');
const SELECTION_FILE = path.join(ASSETS_ROOT, 'selection.json');
const PORT = Number(process.env.CAPITAL_PORT || 4310);

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);
const SKIP_DIRS = new Set(['_staging', '_edited', '.git', 'generated']);

const app = express();
app.use(express.json({limit: '20mb'}));
app.use(express.static(path.join(__dirname, 'public')));

/** In-memory map documents (source of truth while editing). */
const docs = {};   // name -> {doc, rev, dirty, clients:Set, saveTimer, undoStack}

// ---------------------------------------------------------------------------
// helpers

function readMap(name)
{
    if(docs[name]){
        return docs[name].doc;
    }
    let full = path.join(MAPS_DIR, name + '.json');
    if(!fs.existsSync(full)){
        return null;
    }
    return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function persistDoc(name, state)
{
    let full = path.join(MAPS_DIR, name + '.json');
    fs.writeFileSync(full, JSON.stringify(state.doc, null, 1));
    let distFull = path.join(DIST_MAPS_DIR, name + '.json');
    fs.mkdirSync(path.dirname(distFull), {recursive: true});
    fs.copyFileSync(full, distFull);
    state.dirty = false;
}

function scheduleSave(name)
{
    let state = docs[name];
    if(!state || state.dirty){
        return;
    }
    state.dirty = true;
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => {
        persistDoc(name, state);
        state.rev++;
    }, 1500);
}

function tileIndex(doc, x, y)
{
    return y * doc.width + x;
}

/** Apply an op to a map doc. Returns inverse op (for undo) or false. */
function applyOp(doc, op)
{
    switch(op.type){
        case 'tile': {
            let layer = doc.layers.find(l => l.name === op.layer);
            if(!layer || layer.type !== 'tilelayer'){ return false; }
            let idx = tileIndex(doc, op.x, op.y);
            let prev = layer.data[idx];
            layer.data[idx] = op.gid;
            return {type: 'tile', layer: op.layer, x: op.x, y: op.y, gid: prev};
        }
        case 'tiles': {
            let layer = doc.layers.find(l => l.name === op.layer);
            if(!layer || layer.type !== 'tilelayer'){ return false; }
            let inverse = {type: 'tiles', layer: op.layer, x: op.x, y: op.y, w: op.w, h: op.h, data: []};
            let k = 0;
            for(let dy = 0; dy < op.h; dy++){
                for(let dx = 0; dx < op.w; dx++){
                    let idx = tileIndex(doc, op.x + dx, op.y + dy);
                    inverse.data.push(layer.data[idx]);
                    layer.data[idx] = op.data[k++];
                }
            }
            return inverse;
        }
        case 'fill': {
            let layer = doc.layers.find(l => l.name === op.layer);
            if(!layer || layer.type !== 'tilelayer'){ return false; }
            let inverse = {type: 'fill', layer: op.layer, x: op.x, y: op.y, w: op.w, h: op.h, gid: layer.data[tileIndex(doc, op.x, op.y)]};
            let first = layer.data[tileIndex(doc, op.x, op.y)];
            for(let dy = 0; dy < op.h; dy++){
                for(let dx = 0; dx < op.w; dx++){
                    layer.data[tileIndex(doc, op.x + dx, op.y + dy)] = op.gid;
                }
            }
            inverse.gid = first;
            return inverse;
        }
        case 'object-add': {
            if(!Array.isArray(doc.objectLayers)){ doc.objectLayers = []; }
            let layer = doc.objectLayers.find(l => l.name === op.layer) || (() => {
                let nl = {name: op.layer || 'objects', type: 'objectgroup', objects: []};
                doc.objectLayers.push(nl);
                return nl;
            })();
            let obj = Object.assign({id: op.object.id || nextObjectId(doc), type: 'sprite', width: 32, height: 32}, op.object);
            layer.objects.push(obj);
            return {type: 'object-remove', layer: layer.name, id: obj.id};
        }
        case 'object-move': {
            let found = findObject(doc, op.id);
            if(!found){ return false; }
            let prev = {x: found.object.x, y: found.object.y};
            found.object.x = op.x;
            found.object.y = op.y;
            return {type: 'object-move', layer: found.layer.name, id: op.id, x: prev.x, y: prev.y};
        }
        case 'object-remove': {
            let found = findObject(doc, op.id);
            if(!found){ return false; }
            let idx = found.layer.objects.indexOf(found.object);
            found.layer.objects.splice(idx, 1);
            return {type: 'object-add', layer: found.layer.name, object: found.object};
        }
        default:
            return false;
    }
}

function nextObjectId(doc)
{
    let max = 0;
    for(let layer of doc.objectLayers || []){
        for(let o of layer.objects){
            if(o.id > max){ max = o.id; }
        }
    }
    return max + 1;
}

function findObject(doc, id)
{
    for(let layer of doc.objectLayers || []){
        let object = layer.objects.find(o => o.id === id);
        if(object){
            return {layer, object};
        }
    }
    return false;
}

function undo(name)
{
    let state = docs[name];
    if(!state || !state.undoStack.length){
        return false;
    }
    let inverse = state.undoStack.pop();
    applyOp(state.doc, inverse);
    state.rev++;
    return inverse;
}

// ---------------------------------------------------------------------------
// API

app.get('/api/maps', (_req, res) => {
    let maps = [];
    for(let file of fs.readdirSync(MAPS_DIR)){
        if(!file.endsWith('.json')){ continue; }
        let full = path.join(MAPS_DIR, file);
        let map = JSON.parse(fs.readFileSync(full, 'utf8'));
        maps.push({
            name: file.replace('.json', ''),
            width: map.width,
            height: map.height,
            tilewidth: map.tilewidth,
            layers: (map.layers || []).map(l => l.name),
            tileset: (map.tilesets && map.tilesets[0] && map.tilesets[0].image) || ''
        });
    }
    maps.sort((a, b) => a.name.localeCompare(b.name));
    res.json({maps});
});

app.get('/api/map', (req, res) => {
    let name = sanitize(req.query.name);
    let doc = readMap(name);
    if(!doc){
        return res.status(404).json({error: 'map not found'});
    }
    res.json({map: doc, rev: docs[name] ? docs[name].rev : 0});
});

app.get('/api/palette', (req, res) => {
    // tileset images available for painting (maps dir + a curated CC0 set)
    let tilesets = [];
    for(let file of fs.readdirSync(MAPS_DIR)){
        if(!IMAGE_EXT.has(path.extname(file).toLowerCase())){ continue; }
        tilesets.push({src: 'maps', path: file, name: file});
    }
    for(let pack of ['kenney/tiny-town', 'kenney/tiny-dungeon', 'kenney/micro-roguelike', 'kenney/rpg-urban-pack', 'kenney/1-bit-pack', '0x72']){
        collectImages(path.join(ASSETS_ROOT, pack), 'cc0', tilesets, 60);
    }
    // object sprites: existing game sprites + selected cc0 images
    let sprites = [];
    collectImages(SPRITES_DIR, 'sprites', sprites, 400);
    let selection = loadSelection();
    let files = selection.files || {};
    for(let rel of Object.keys(files)){
        if(files[rel] !== 'use' && files[rel] !== 'favorite'){ continue; }
        let full = path.join(ASSETS_ROOT, rel);
        if(!fs.existsSync(full) || !IMAGE_EXT.has(path.extname(full).toLowerCase())){ continue; }
        sprites.push({src: 'cc0', path: rel, name: path.basename(rel), pack: rel.split('/')[1] || ''});
    }
    res.json({tilesets, sprites});
});

app.get('/file', (req, res) => {
    let src = req.query.src;
    let p = req.query.p;
    if(!p || p.includes('..')){
        return res.status(400).send('bad path');
    }
    let root = src === 'maps' ? MAPS_DIR : src === 'sprites' ? SPRITES_DIR : ASSETS_ROOT;
    let full = path.join(root, p);
    if(!fs.existsSync(full)){
        return res.status(404).send('not found');
    }
    res.sendFile(full);
});

/** Render a map to PNG with the real tileset (WYSIWYG preview for editor + AI). */
app.get('/render', async (req, res) => {
    let name = sanitize(req.query.name);
    let doc = readMap(name);
    if(!doc){
        return res.status(404).json({error: 'map not found'});
    }
    let scale = Math.max(0.25, Math.min(4, Number(req.query.scale || 1)));
    let tileSize = Number(req.query.tile || doc.tilewidth || 32);
    let fullW = doc.width * tileSize;
    let fullH = doc.height * tileSize;
    try {
        let layers = doc.layers.filter(l => l.type === 'tilelayer' && l.visible !== false);
        let composites = [];
        let tileCache = {};
        for(let layer of layers){
            let layerTiles = await renderLayerTiles(doc, layer, tileCache, tileSize);
            if(layerTiles.length){
                let buf = await sharp({create: {width: fullW, height: fullH, channels: 4, background: '#0000'}}).png().composite(layerTiles).toBuffer();
                composites.push({input: buf, left: 0, top: 0});
            }
        }
        let objBuf = await renderObjects(doc, tileSize);
        if(objBuf){
            composites.push({input: objBuf, left: 0, top: 0});
        }
        let out;
        if(composites.length){
            out = await sharp({create: {width: fullW, height: fullH, channels: 3, background: '#10131a'}})
                .composite(composites)
                .png()
                .toBuffer();
        } else {
            out = await sharp({create: {width: fullW, height: fullH, channels: 3, background: '#10131a'}})
                .png()
                .toBuffer();
        }
        if(scale !== 1){
            out = await sharp(out)
                .resize(Math.max(1, Math.round(fullW * scale)), Math.max(1, Math.round(fullH * scale)))
                .png()
                .toBuffer();
        }
        res.type('png').send(out);
    } catch (error) {
        res.status(500).send(String((error && error.stack) || error));
    }
});

async function loadTilesetImages(doc)
{
    let info = [];
    for(let ts of doc.tilesets || []){
        let imageName = ts.image || '';
        let candidates = [
            path.join(MAPS_DIR, imageName),
            path.join(ASSETS_ROOT, imageName)
        ];
        let found = candidates.find(f => fs.existsSync(f));
        if(!found){
            continue;
        }
        let meta = await sharp(found).metadata();
        info.push({
            firstgid: ts.firstgid || 1,
            imagePath: found,
            imageWidth: meta.width,
            imageHeight: meta.height,
            tilewidth: ts.tilewidth || doc.tilewidth || 32,
            tileheight: ts.tileheight || doc.tileheight || 32,
            cols: Math.floor(meta.width / (ts.tilewidth || 32))
        });
    }
    return info;
}

async function renderLayerTiles(doc, layer, tileCache, tileSize)
{
    let tilesetInfo = await loadTilesetImages(doc);
    let cols = doc.width;
    let tiles = [];
    for(let i = 0; i < layer.data.length; i++){
        let gid = layer.data[i];
        if(!gid){ continue; }
        let ts = tilesetInfo.find(t => gid >= t.firstgid && gid < t.firstgid + Math.floor(t.imageWidth / t.tilewidth) * Math.floor(t.imageHeight / t.tileheight));
        if(!ts){ continue; }
        let local = gid - ts.firstgid;
        let sx = (local % ts.cols) * ts.tilewidth;
        let sy = Math.floor(local / ts.cols) * ts.tileheight;
        let key = ts.firstgid + ':' + local;
        if(!tileCache[key]){
            tileCache[key] = await sharp(ts.imagePath)
                .extract({left: sx, top: sy, width: ts.tilewidth, height: ts.tileheight})
                .toBuffer();
        }
        let x = (i % cols) * tileSize;
        let y = Math.floor(i / cols) * tileSize;
        tiles.push({input: tileCache[key], left: x, top: y});
    }
    return tiles;
}

async function renderObjects(doc, tileSize)
{
    let layers = doc.objectLayers || [];
    if(!layers.length || !layers.some(l => l.objects && l.objects.length)){
        return null;
    }
    let fullW = doc.width * tileSize;
    let fullH = doc.height * tileSize;
    let svgTiles = [];
    let idx = 0;
    for(let layer of layers){
        for(let o of layer.objects || []){
            let x = Math.round(o.x);
            let y = Math.round(o.y);
            let bw = Math.max(8, Math.round(o.width || tileSize));
            let bh = Math.max(8, Math.round(o.height || tileSize));
            let color = (idx++ % 2) ? '#ff5252' : '#ffab40';
            let label = String(o.name || o.type || 'obj').slice(0, 18);
            let svg = Buffer.from(
                `<svg width="${bw}" height="${bh}" xmlns="http://www.w3.org/2000/svg">
                   <rect x="0" y="0" width="${bw}" height="${bh}" fill="${color}" fill-opacity="0.45"/>
                   <rect x="0" y="0" width="${bw}" height="${bh}" fill="none" stroke="${color}" stroke-width="2"/>
                   <text x="3" y="12" font-size="10" fill="#fff" font-family="monospace">${label}</text>
                 </svg>`);
            svgTiles.push({input: svg, left: x, top: y});
        }
    }
    if(!svgTiles.length){ return null; }
    return sharp({create: {width: fullW, height: fullH, channels: 4, background: '#0000'}}).png().composite(svgTiles).toBuffer();
}

function collectImages(root, src, out, cap)
{
    if(!fs.existsSync(root)){ return; }
    let walk = (dir, rel) => {
        for(let entry of fs.readdirSync(dir, {withFileTypes: true})){
            if(out.length >= cap){ return; }
            if(entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)){ continue; }
            let full = path.join(dir, entry.name);
            let relPath = rel ? rel + '/' + entry.name : entry.name;
            if(entry.isDirectory()){
                walk(full, relPath);
            } else if(IMAGE_EXT.has(path.extname(entry.name).toLowerCase())){
                out.push({src, path: relPath, name: entry.name, size: fs.statSync(full).size});
            }
        }
    };
    walk(root, '');
}

function loadSelection()
{
    try {
        return JSON.parse(fs.readFileSync(SELECTION_FILE, 'utf8'));
    } catch (error) {
        return {version: 2, frames: {}, files: {}, tags: {}};
    }
}

function sanitize(name)
{
    if(!name || typeof name !== 'string'){ return ''; }
    let cleaned = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return cleaned.slice(0, 80);
}

// ---------------------------------------------------------------------------
// WebSocket collab channel

const server = http.createServer(app);
const wss = new WebSocketServer({noServer: true});

server.on('upgrade', (req, socket, head) => {
    let url = new URL(req.url, 'http://localhost');
    if(url.pathname !== '/collab'){
        return socket.destroy();
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
        ws._mapName = sanitize(url.searchParams.get('map'));
        ws._clientId = 'c' + Math.random().toString(36).slice(2, 8);
        wss.emit('connection', ws, req);
    });
});

function broadcast(mapName, message, except)
{
    let payload = JSON.stringify(message);
    let state = docs[mapName];
    if(!state){ return; }
    for(let ws of state.clients){
        if(ws !== except && ws.readyState === WebSocket.OPEN){
            ws.send(payload);
        }
    }
}

wss.on('connection', (ws) => {
    let mapName = ws._mapName || '';
    if(!mapName){
        ws.close(4000, 'missing map');
        return;
    }
    let doc = readMap(mapName);
    if(!doc){
        ws.close(4004, 'map not found');
        return;
    }
    if(!docs[mapName]){
        docs[mapName] = {doc, rev: 0, dirty: false, clients: new Set(), undoStack: []};
    }
    let state = docs[mapName];
    state.clients.add(ws);
    ws.send(JSON.stringify({type: 'snapshot', map: mapName, doc: state.doc, rev: state.rev, clientId: ws._clientId, peers: state.clients.size}));

    ws.on('message', (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        } catch (error) {
            return;
        }
        if(msg.type === 'op'){
            let inverse = applyOp(state.doc, msg.op);
            if(false !== inverse){
                state.undoStack.push(inverse);
                if(state.undoStack.length > 200){ state.undoStack.shift(); }
                state.rev++;
                scheduleSave(mapName);
                broadcast(mapName, {type: 'op', op: msg.op, author: ws._clientId, rev: state.rev});
            }
        } else if(msg.type === 'undo'){
            let inverse = undo(mapName);
            if(inverse){
                scheduleSave(mapName);
                broadcast(mapName, {type: 'op', op: inverse, author: 'undo', rev: state.rev});
            }
        } else if(msg.type === 'save'){
            persistDoc(mapName, state);
            state.rev++;
            broadcast(mapName, {type: 'saved', rev: state.rev});
        } else if(msg.type === 'join-map'){
            ws._mapName = sanitize(msg.map);
            // switch to another map: leave current group
        }
    });

    ws.on('close', () => {
        state.clients.delete(ws);
        broadcast(mapName, {type: 'peers', count: state.clients.size});
    });

    ws.send(JSON.stringify({type: 'peers', count: state.clients.size}));
});

/** AI/client HTTP push - same wire as WS. */
app.post('/api/op', (req, res) => {
    let body = req.body || {};
    let mapName = sanitize(body.map);
    let op = body.op;
    if(!mapName || !op){
        return res.status(400).json({error: 'map and op required'});
    }
    let doc = readMap(mapName);
    if(!doc){
        return res.status(404).json({error: 'map not found'});
    }
    if(!docs[mapName]){
        docs[mapName] = {doc, rev: 0, dirty: false, clients: new Set(), undoStack: []};
    }
    let state = docs[mapName];
    let inverse = applyOp(state.doc, op);
    if(false === inverse){
        return res.status(422).json({error: 'op rejected'});
    }
    state.undoStack.push(inverse);
    if(state.undoStack.length > 200){ state.undoStack.shift(); }
    state.rev++;
    scheduleSave(mapName);
    broadcast(mapName, {type: 'op', op, author: 'ai', rev: state.rev});
    res.json({ok: true, rev: state.rev, undo: inverse});
});

app.post('/api/undo', (req, res) => {
    let mapName = sanitize(req.body && req.body.map);
    let inverse = undo(mapName);
    if(!inverse){
        return res.status(422).json({error: 'nothing to undo'});
    }
    scheduleSave(mapName);
    broadcast(mapName, {type: 'op', op: inverse, author: 'ai', rev: docs[mapName].rev});
    res.json({ok: true});
});

app.post('/api/save', (req, res) => {
    let mapName = sanitize(req.body && req.body.map);
    let doc = readMap(mapName);
    if(!doc){
        return res.status(404).json({error: 'map not found'});
    }
    if(!docs[mapName]){
        docs[mapName] = {doc, rev: 0, dirty: false, clients: new Set(), undoStack: []};
    }
    persistDoc(mapName, docs[mapName]);
    res.json({ok: true, name: mapName});
});

server.listen(PORT, () => {
    console.log(`[capital-builder] http://localhost:${PORT}`);
    console.log(`  maps: ${MAPS_DIR}`);
});
