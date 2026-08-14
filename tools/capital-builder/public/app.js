const PORT = 4310;
const $ = id => document.getElementById(id);

const state = {
    maps: [],
    currentMap: '',
    doc: null,
    rev: 0,
    ws: null,
    clientId: '',
    peers: 0,
    tool: 'tile',          // tile | object | move
    tilesetIndex: 0,
    selectedGid: 0,
    selectedSprite: null,
    currentLayer: '',      // active tile layer
    tilesetImages: {},     // gid -> {img, ts}
    spriteImages: {},      // object id -> HTMLImage
    palette: {tilesets: [], sprites: []},
    dragging: false,
    lastCell: null,
    drawing: false,
    selectedObject: null
};

const canvas = $('map-canvas');
const ctx = canvas.getContext('2d');
const FILE = (src, p) => `/file?src=${encodeURIComponent(src)}&p=${encodeURIComponent(p)}`;

function toast(msg, isError = false)
{
    let el = document.createElement('div');
    el.className = 'toast' + (isError ? ' error' : '');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); }, 2600);
}

async function api(path, options = {})
{
    let res = await fetch(path, {headers: {'Content-Type': 'application/json'}, ...options});
    let data = await res.json().catch(() => ({}));
    if(!res.ok){ throw new Error(data.error || res.statusText); }
    return data;
}

// ---------------------------------------------------------------------------
// map list + load

async function loadMaps()
{
    let data = await api('/api/maps');
    state.maps = data.maps;
    let sel = $('map-select');
    sel.innerHTML = '';
    for(let m of state.maps){
        let opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = m.name + ' (' + m.width + 'x' + m.height + ')';
        sel.appendChild(opt);
    }
    if(state.maps.length){
        sel.value = state.currentMap;
        connectMap(sel.value);
    }
}

async function connectMap(name)
{
    state.currentMap = name;
    if(state.ws){
        state.ws.close();
    }
    let data = await api('/api/map?name=' + encodeURIComponent(name));
    state.doc = data.map;
    state.rev = data.rev;
    $('map-size').textContent = data.map.width + ' x ' + data.map.height;
    $('map-tile').textContent = data.map.tilewidth + 'px';
    openWs();
    afterDoc();
}

function openWs()
{
    let proto = location.protocol === 'https:' ? 'wss' : 'ws';
    state.ws = new WebSocket(`${proto}://${location.host}/collab?map=${encodeURIComponent(state.currentMap)}`);
    state.ws.onopen = () => { setPeer(1); };
    state.ws.onmessage = (ev) => {
        let msg = JSON.parse(ev.data);
        if(msg.type === 'snapshot'){
            state.doc = msg.doc;
            state.rev = msg.rev;
            state.clientId = msg.clientId;
            afterDoc();
        } else if(msg.type === 'op'){
            applyOpToDoc(msg.op);
            state.rev = msg.rev;
            render();
        } else if(msg.type === 'peers'){
            setPeer(msg.count);
        } else if(msg.type === 'saved'){
            $('save-status').textContent = 'salvo ' + new Date().toLocaleTimeString();
        }
    };
    state.ws.onclose = () => setPeer(0);
}

function setPeer(n)
{
    state.peers = n;
    let el = $('peers');
    el.textContent = n + ' conectado' + (n === 1 ? '' : 's');
    el.classList.toggle('online', n > 0);
}

function send(msg)
{
    if(state.ws && state.ws.readyState === WebSocket.OPEN){
        state.ws.send(JSON.stringify(msg));
    }
}

function afterDoc()
{
    buildLayers();
    buildTilesetSelect();
    loadTilesetImages();
    buildTilePalette();
    buildSpritePalette();
    render();
    $('save-status').textContent = 'sincronizado';
}

// ---------------------------------------------------------------------------
// doc ops (shared with server; server is authority but local applies too)

function idx(doc, x, y){ return y * doc.width + x; }

function applyOpToDoc(op)
{
    let doc = state.doc;
    switch(op.type){
        case 'tile': {
            let layer = doc.layers.find(l => l.name === op.layer);
            if(layer && layer.type === 'tilelayer'){ layer.data[idx(doc, op.x, op.y)] = op.gid; }
            break;
        }
        case 'tiles': {
            let layer = doc.layers.find(l => l.name === op.layer);
            if(layer && layer.type === 'tilelayer'){
                let k = 0;
                for(let dy = 0; dy < op.h; dy++){
                    for(let dx = 0; dx < op.w; dx++){
                        layer.data[idx(doc, op.x + dx, op.y + dy)] = op.data[k++];
                    }
                }
            }
            break;
        }
        case 'fill': {
            let layer = doc.layers.find(l => l.name === op.layer);
            if(layer && layer.type === 'tilelayer'){
                for(let dy = 0; dy < op.h; dy++){
                    for(let dx = 0; dx < op.w; dx++){
                        layer.data[idx(doc, op.x + dx, op.y + dy)] = op.gid;
                    }
                }
            }
            break;
        }
        case 'object-add': {
            if(!Array.isArray(doc.objectLayers)){ doc.objectLayers = []; }
            let layer = doc.objectLayers.find(l => l.name === op.layer);
            if(!layer){
                layer = {name: op.layer, type: 'objectgroup', objects: []};
                doc.objectLayers.push(layer);
            }
            layer.objects.push(Object.assign({width: 32, height: 32}, op.object));
            break;
        }
        case 'object-move': {
            let found = findObject(op.id);
            if(found){ found.object.x = op.x; found.object.y = op.y; }
            break;
        }
        case 'object-remove': {
            let found = findObject(op.id);
            if(found){
                let i = found.layer.objects.indexOf(found.object);
                found.layer.objects.splice(i, 1);
            }
            break;
        }
    }
}

function findObject(id)
{
    for(let layer of state.doc.objectLayers || []){
        let object = layer.objects.find(o => o.id === id);
        if(object){ return {layer, object}; }
    }
    return null;
}

function nextObjectId()
{
    let max = 0;
    for(let layer of state.doc.objectLayers || []){
        for(let o of layer.objects){ if(o.id > max){ max = o.id; } }
    }
    return max + 1;
}

// ---------------------------------------------------------------------------
// layers + tilesets

function buildLayers()
{
    let list = $('layer-list');
    list.innerHTML = '';
    let layers = (state.doc.layers || []).filter(l => l.type === 'tilelayer');
    if(!state.currentLayer || !layers.find(l => l.name === state.currentLayer)){
        state.currentLayer = layers.length ? layers[layers.length - 1].name : '';
    }
    for(let layer of layers){
        let row = document.createElement('div');
        row.className = 'layer-row' + (layer.name === state.currentLayer ? ' active' : '');
        let vis = document.createElement('input');
        vis.type = 'checkbox';
        vis.checked = layer.visible !== false;
        vis.addEventListener('change', () => { layer.visible = vis.checked; render(); });
        let name = document.createElement('span');
        name.textContent = layer.name;
        name.style.flex = '1';
        row.append(vis, name);
        row.addEventListener('click', (ev) => {
            if(ev.target.tagName !== 'INPUT'){
                state.currentLayer = layer.name;
                buildLayers();
            }
        });
        list.appendChild(row);
    }
}

function buildTilesetSelect()
{
    let sel = $('tileset-select');
    sel.innerHTML = '';
    (state.doc.tilesets || []).forEach((ts, i) => {
        let opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = (ts.name || ts.image || 'tileset') + ' (gid ' + ts.firstgid + ')';
        sel.appendChild(opt);
    });
    sel.value = String(state.tilesetIndex);
    sel.onchange = () => {
        state.tilesetIndex = Number(sel.value);
        let ts = state.doc.tilesets[state.tilesetIndex];
        state.selectedGid = ts ? ts.firstgid : 0;
        buildTilePalette();
    };
}

async function loadTilesetImages()
{
    state.tilesetImages = {};
    for(let ts of state.doc.tilesets || []){
        let imageName = ts.image || '';
        let img = new Image();
        let loaded = new Promise(resolve => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
        });
        img.src = FILE('maps', imageName);
        let ok = await loaded;
        if(!ok){
            img = new Image();
            await new Promise(resolve => {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = FILE('cc0', imageName);
            });
        }
        if(img.complete && img.naturalWidth){
            state.tilesetImages[ts.firstgid] = {
                img,
                ts,
                cols: Math.floor(img.naturalWidth / (ts.tilewidth || state.doc.tilewidth || 32))
            };
        }
    }
    render();
}

function tilesetForGid(gid)
{
    for(let firstgid of Object.keys(state.tilesetImages).map(Number).sort((a, b) => a - b)){
        let entry = state.tilesetImages[firstgid];
        let total = Math.floor(entry.img.naturalWidth / entry.ts.tilewidth) * Math.floor(entry.img.naturalHeight / entry.ts.tileheight);
        if(gid >= firstgid && gid < firstgid + total){
            return {firstgid, ...entry};
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// palettes

function buildTilePalette()
{
    let grid = $('tile-palette');
    grid.innerHTML = '';
    let ts = state.doc.tilesets && state.doc.tilesets[state.tilesetIndex];
    if(!ts){ grid.innerHTML = '<div class="hint" style="position:static">sem tileset</div>'; return; }
    let entry = state.tilesetImages[ts.firstgid];
    if(!entry){ grid.innerHTML = '<div class="hint" style="position:static">carregando...</div>'; return; }
    let tw = ts.tilewidth, th = ts.tileheight;
    let total = Math.floor(entry.img.naturalWidth / tw) * Math.floor(entry.img.naturalHeight / th);
    for(let i = 0; i < total; i++){
        let sx = (i % entry.cols) * tw;
        let sy = Math.floor(i / entry.cols) * th;
        let cell = document.createElement('div');
        cell.className = 'palette-cell' + (ts.firstgid + i === state.selectedGid ? ' selected' : '');
        let img = document.createElement('img');
        img.src = entry.img.src;
        img.style.objectFit = 'none';
        img.style.width = '160px';
        img.style.height = '160px';
        img.style.maxWidth = 'none';
        img.style.transform = `translate(${-sx * (160 / tw)}px, ${-sy * (160 / th)}px) scale(${160 / tw / 2})`;
        img.style.transformOrigin = 'top left';
        img.style.imageRendering = 'pixelated';
        let gid = document.createElement('div');
        gid.className = 'gid';
        gid.textContent = String(ts.firstgid + i);
        cell.append(img, gid);
        cell.onclick = () => {
            state.selectedGid = ts.firstgid + i;
            buildTilePalette();
        };
        grid.appendChild(cell);
    }
}

async function buildSpritePalette()
{
    let data = await api('/api/palette');
    state.palette = data;
    let grid = $('sprite-palette');
    grid.innerHTML = '';
    let shown = 0;
    for(let spr of data.sprites.slice(0, 240)){
        let cell = document.createElement('div');
        cell.className = 'palette-cell';
        let img = document.createElement('img');
        img.src = FILE(spr.src, spr.path);
        img.loading = 'lazy';
        img.title = spr.name;
        cell.appendChild(img);
        cell.onclick = () => {
            state.selectedSprite = {src: spr.src, path: spr.path, name: spr.name};
            $('sprite-group').querySelectorAll('.palette-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
            toast('Objeto: ' + spr.name);
        };
        grid.appendChild(cell);
        shown++;
    }
    if(!shown){ grid.innerHTML = '<div style="color:#8b96ad;font-size:11px">Selecione assets no Asset Browser (usar/favorito)</div>'; }
}

// ---------------------------------------------------------------------------
// render

function render()
{
    let doc = state.doc;
    if(!doc){ return; }
    let tw = doc.tilewidth, th = doc.tileheight;
    canvas.width = doc.width * tw;
    canvas.height = doc.height * th;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#10131a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let layers = (doc.layers || []).filter(l => l.type === 'tilelayer' && l.visible !== false);
    for(let layer of layers){
        for(let i = 0; i < layer.data.length; i++){
            let gid = layer.data[i];
            if(!gid){ continue; }
            let entry = tilesetForGid(gid);
            if(!entry){ continue; }
            let local = gid - entry.firstgid;
            let sx = (local % entry.cols) * entry.ts.tilewidth;
            let sy = Math.floor(local / entry.cols) * entry.ts.tileheight;
            let x = (i % doc.width) * tw;
            let y = Math.floor(i / doc.width) * th;
            ctx.drawImage(entry.img, sx, sy, entry.ts.tilewidth, entry.ts.tileheight, x, y, tw, th);
        }
    }
    // object markers
    for(let layer of doc.objectLayers || []){
        for(let o of layer.objects || []){
            let ow = o.width || tw, oh = o.height || th;
            ctx.fillStyle = o === state.selectedObject ? 'rgba(127,211,127,0.45)' : 'rgba(91,140,255,0.4)';
            ctx.fillRect(o.x, o.y, ow, oh);
            ctx.strokeStyle = o === state.selectedObject ? '#7fd37f' : '#5b8cff';
            ctx.lineWidth = 2;
            ctx.strokeRect(o.x, o.y, ow, oh);
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText(String(o.name || o.type || 'obj').slice(0, 20), o.x + 3, o.y + 11);
        }
    }
}

// ---------------------------------------------------------------------------
// tools + canvas events

function canvasPos(ev)
{
    let rect = canvas.getBoundingClientRect();
    let x = Math.floor((ev.clientX - rect.left) * (canvas.width / rect.width));
    let y = Math.floor((ev.clientY - rect.top) * (canvas.height / rect.height));
    return {x, y};
}

function cellFrom(ev)
{
    let {x, y} = canvasPos(ev);
    let tw = state.doc.tilewidth, th = state.doc.tileheight;
    return {cx: Math.floor(x / tw), cy: Math.floor(y / th), px: x, py: y};
}

function setTool(tool)
{
    state.tool = tool;
    for(let t of document.querySelectorAll('.tool')){
        t.classList.toggle('active', t.dataset.tool === tool);
    }
    $('tile-palette').parentElement.style.display = tool === 'tile' ? '' : 'none';
    $('sprite-group').style.display = tool === 'object' ? '' : 'none';
    $('hint').textContent = tool === 'tile' ? 'Clique pinta · botão direito apaga · roda do mouse troca tile' : tool === 'object' ? 'Escolha asset na paleta e clique para posicionar' : 'Clique seleciona · arrasta move · Del remove';
}

canvas.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    let {cx, cy} = cellFrom(ev);
    state.dragging = true;
    if(ev.button === 2){ // erase
        doTileOp(cx, cy, 0);
    } else if(state.tool === 'tile'){
        if(!state.currentLayer){ return; }
        doTileOp(cx, cy, state.selectedGid);
    } else if(state.tool === 'object'){
        if(state.selectedSprite){
            let doc = state.doc;
            let obj = {
                id: nextObjectId(),
                name: state.selectedSprite.name.replace(/\.png$/i, '').slice(0, 32),
                type: 'sprite',
                src: state.selectedSprite.src,
                path: state.selectedSprite.path,
                x: cx * doc.tilewidth,
                y: cy * doc.tileheight,
                width: doc.tilewidth,
                height: doc.tileheight
            };
            let op = {type: 'object-add', layer: 'objects', object: obj};
            applyOpToDoc(op);
            send({type: 'op', op});
            render();
        }
    } else if(state.tool === 'move'){
        state.selectedObject = findObjectAt(cx * state.doc.tilewidth, cy * state.doc.tileheight);
        render();
    }
});

canvas.addEventListener('mousemove', (ev) => {
    if(!state.dragging){ return; }
    let {cx, cy} = cellFrom(ev);
    if(state.tool === 'tile'){
        let key = cx + ',' + cy;
        if(key !== state.lastCell){
            state.lastCell = key;
            doTileOp(cx, cy, ev.buttons === 2 ? 0 : state.selectedGid);
        }
    } else if(state.tool === 'move' && state.selectedObject){
        state.selectedObject.x = cx * state.doc.tilewidth;
        state.selectedObject.y = cy * state.doc.tileheight;
        let op = {type: 'object-move', layer: 'objects', id: state.selectedObject.id, x: state.selectedObject.x, y: state.selectedObject.y};
        send({type: 'op', op});
        render();
    }
});

window.addEventListener('mouseup', () => {
    state.dragging = false;
    state.lastCell = null;
});

function doTileOp(cx, cy, gid)
{
    let doc = state.doc;
    if(cx < 0 || cy < 0 || cx >= doc.width || cy >= doc.height){ return; }
    let layer = doc.layers.find(l => l.name === state.currentLayer);
    if(!layer || layer.type !== 'tilelayer'){ return; }
    if(layer.data[idx(doc, cx, cy)] === gid){ return; }
    let op = {type: 'tile', layer: state.currentLayer, x: cx, y: cy, gid};
    applyOpToDoc(op);
    send({type: 'op', op});
    render();
}

function findObjectAt(x, y)
{
    for(let layer of state.doc.objectLayers || []){
        for(let o of layer.objects || []){
            if(x >= o.x && x < o.x + (o.width || 32) && y >= o.y && y < o.y + (o.height || 32)){
                return o;
            }
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// keyboard + controls

window.addEventListener('keydown', (ev) => {
    if(ev.ctrlKey && ev.key.toLowerCase() === 'z'){
        ev.preventDefault();
        send({type: 'undo'});
        return;
    }
    if(ev.key === 'Delete' && state.selectedObject){
        let op = {type: 'object-remove', layer: 'objects', id: state.selectedObject.id};
        applyOpToDoc(op);
        send({type: 'op', op});
        state.selectedObject = null;
        render();
    }
    if(['1', '2', '3'].includes(ev.key)){
        setTool(ev.key === '1' ? 'tile' : ev.key === '2' ? 'object' : 'move');
    }
});

$('btn-undo').onclick = () => send({type: 'undo'});
$('btn-save').onclick = () => {
    send({type: 'save'});
    toast('Salvo!');
};
$('btn-play').onclick = () => {
    window.open('http://localhost:8080', '_blank');
};
$('btn-refresh-preview').onclick = refreshPreview;
$('map-select').onchange = (ev) => connectMap(ev.target.value);

document.querySelectorAll('.tool').forEach(btn => {
    btn.onclick = () => setTool(btn.dataset.tool);
});

function refreshPreview()
{
    let img = $('preview-img');
    img.src = '/render?name=' + encodeURIComponent(state.currentMap) + '&scale=0.5&t=' + Date.now();
}

(async function init()
{
    setTool('tile');
    await loadMaps();
    refreshPreview();
})();
