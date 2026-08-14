const $ = (s) => document.querySelector(s);

const state = {
    tree: [],
    currentDir: '',
    search: '',
    selection: { version: 2, frames: {}, files: {}, tags: {} },
    currentFile: null,
    imageMeta: null,
    img: null,
    tileSize: 16,
    offsetX: 0,
    offsetY: 0,
    showGrid: true,
    animOn: false,
    animTimer: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    hoverFrame: null,
    edited: {}          // path -> {x:file}
};

async function api(url, opts) {
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

const fileKey = (p) => p.replace(/\\/g, '/');
const frameKey = (p, x, y) => `${fileKey(p)}#${x},${y}`;

function frameState(p, x, y) {
    if (x === undefined || y === undefined) return state.selection.files[fileKey(p)] || '';
    return state.selection.frames[frameKey(p, x, y)] || '';
}
function setFrameState(p, x, y, v) {
    const k = frameKey(p, x, y);
    if (v) state.selection.frames[k] = v;
    else delete state.selection.frames[k];
}
function setFileState(p, v) {
    if (v) state.selection.files[fileKey(p)] = v;
    else delete state.selection.files[fileKey(p)];
}

/* ---------------- Tree ---------------- */

function flatten(nodes, prefix, out, depth) {
    for (const n of nodes) {
        if (n.type === 'dir') {
            out.push({ ...n, depth, isDir: true, count: countFiles(n) });
            flatten(n.children || [], n.path, out, depth + 1);
        } else {
            out.push({ ...n, depth, isDir: false });
        }
    }
    return out;
}
function countFiles(n) {
    let c = 0;
    for (const ch of n.children || []) c += ch.type === 'dir' ? countFiles(ch) : 1;
    return c;
}

function renderTree() {
    const el = $('#tree');
    el.innerHTML = '';
    const flat = flatten(state.tree, '', [], 0);
    const q = state.search.trim().toLowerCase();
    for (const n of flat) {
        if (q && !n.path.toLowerCase().includes(q)) continue;
        if (q && n.isDir && n.count === 0) continue;
        const div = document.createElement('div');
        div.className = 'node ' + (n.isDir ? 'dir' : 'file') + (n.path === state.currentDir ? ' active' : '');
        div.style.paddingLeft = `${8 + n.depth * 14}px`;
        if (n.isDir) {
            const span = document.createElement('span');
            span.textContent = n.name;
            span.title = n.path;
            const c = document.createElement('span');
            c.className = 'count';
            c.textContent = n.count;
            div.append(span, c);
            div.onclick = () => { state.currentDir = n.path; renderTree(); renderGallery(); };
        } else {
            div.title = n.path;
            const st = frameState(n.path);
            const span = document.createElement('span');
            span.textContent = n.name;
            span.style.flex = '1';
            div.append(span);
            if (st) { const b = document.createElement('span'); b.className = 'badge ' + st; b.textContent = st; div.append(b); }
            div.onclick = () => { state.currentDir = n.path.replace(/\/[^/]+$/, ''); renderTree(); openViewer(n); };
        }
        el.appendChild(div);
    }
}

function galleryFiles() {
    const out = [];
    const depth = state.currentDir ? state.currentDir.split('/').length : 0;
    for (const n of flatten(state.tree, '', [], 0)) {
        if (n.isDir) {
            if (n.path === state.currentDir) continue;
            const d = n.path.split('/').length;
            if (state.currentDir && !(n.path.startsWith(state.currentDir + '/') && d === depth + 1)) continue;
            if (!state.currentDir && n.path.includes('/')) continue;
            out.push(n);
        } else {
            if (state.currentDir && !n.path.startsWith(state.currentDir + '/')) continue;
            if (!state.currentDir && n.path.includes('/')) continue;
            out.push(n);
        }
    }
    return out;
}

/* ---------------- Gallery ---------------- */

function firstImageIn(nodes) {
    for (const n of nodes || []) {
        if (n.type === 'image') return n.path;
        if (n.type === 'dir') {
            const r = firstImageIn(n.children);
            if (r) return r;
        }
    }
    return null;
}

function renderGallery() {
    const gal = $('#gallery');
    gal.innerHTML = '';
    const files = galleryFiles();
    if (!files.length) { gal.innerHTML = '<div class="empty">Nenhum arquivo aqui</div>'; return; }
    const q = state.search.trim().toLowerCase();
    for (const f of files) {
        if (q && !f.path.toLowerCase().includes(q)) continue;
        if (f.isDir && f.count === 0) continue;
        const card = document.createElement('div');
        card.className = 'card' + (state.edited[f.path] ? ' edited' : '');
        const thumb = document.createElement('div');
        thumb.className = 'card-thumb' + (f.type === 'audio' ? ' audio' : '');
        if (f.isDir) {
            const first = firstImageIn(findNodeChildren(state.tree, f.path));
            if (first) {
                const img = document.createElement('img');
                img.src = `/api/file?p=${encodeURIComponent(first)}`;
                img.loading = 'lazy';
                img.onerror = () => { thumb.textContent = '🗂'; };
                thumb.appendChild(img);
            } else {
                thumb.textContent = '🗂';
            }
        } else if (f.type === 'image') {
            const img = document.createElement('img');
            img.src = `/api/file?p=${encodeURIComponent(f.path)}`;
            img.loading = 'lazy';
            img.onerror = () => { thumb.textContent = '⚠'; };
            thumb.appendChild(img);
        } else if (f.type === 'audio') {
            thumb.textContent = '🎵';
        }
        const body = document.createElement('div');
        body.className = 'card-body';
        const name = document.createElement('span');
        name.className = 'card-name';
        name.textContent = f.isDir ? `📁 ${f.name}` : f.name;
        body.appendChild(name);
        if (f.isDir) {
            const c = document.createElement('span');
            c.className = 'size';
            c.textContent = f.count;
            body.appendChild(c);
        }
        card.append(thumb, body);
        const st = frameState(f.path);
        if (st && !f.isDir) {
            const b = document.createElement('span');
            b.className = 'badge ' + st;
            b.textContent = st;
            card.appendChild(b);
        }
        card.onclick = () => f.isDir ? openDir(f) : openViewer(f);
        gal.appendChild(card);
    }
    updateStats();
}

function findNodeChildren(nodes, path) {
    for (const n of nodes) {
        if (n.path === path) return n.children || [];
        if (n.type === 'dir') {
            const r = findNodeChildren(n.children, path);
            if (r) return r;
        }
    }
    return null;
}

function openDir(f) {
    state.currentDir = f.path;
    state.currentFile = null;
    renderTree();
    renderGallery();
    renderCrumbs();
}

/* ---------------- Viewer ---------------- */

async function openViewer(f) {
    state.currentFile = f;
    state.img = null;
    state.imageMeta = null;
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    state.hoverFrame = null;
    stopAnim();
    $('#viewer').classList.remove('hidden');
    $('#gallery').classList.add('hidden');
    $('#viewer-title').textContent = f.path;
    state.edited[f.path] = await api(`/api/edited?p=${encodeURIComponent(f.path)}`);
    if (f.type === 'image') {
        state.imageMeta = await api(`/api/image?p=${encodeURIComponent(f.path)}`);
        if (state.tileSize === 0) autoTileSize();
        $('#audio-box').classList.add('hidden');
        loadImage(f);
    } else if (f.type === 'audio') {
        $('#audio-box').classList.remove('hidden');
        $('#audio-player').src = `/api/file?p=${encodeURIComponent(f.path)}`;
        $('#audio-player').play();
        fitView();
    }
    renderCrumbs();
}

function autoTileSize() {
    const { width, height } = state.imageMeta;
    const g = (a, b) => (b ? g(b, a % b) : a);
    const candidates = [16, 8, 24, 32, 48, 64];
    for (const c of candidates) {
        if (width % c === 0 && height % c === 0) { state.tileSize = c; $('#tile-size').value = c; return; }
    }
    state.tileSize = 16;
    $('#tile-size').value = 16;
}

function loadImage(f) {
    const img = new Image();
    img.onload = () => { state.img = img; fitView(); drawCanvas(); };
    img.src = `/api/file?p=${encodeURIComponent(f.path)}`;
}

function drawCanvas() {
    const canvas = $('#viewer-canvas');
    const ctx = canvas.getContext('2d');
    if (!state.img || !state.imageMeta) return;
    const { width, height } = state.imageMeta;
    canvas.width = Math.floor(width * state.zoom);
    canvas.height = Math.floor(height * state.zoom);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(state.panX, state.panY);
    ctx.drawImage(state.img, 0, 0, width * state.zoom, height * state.zoom);

    if (state.showGrid) {
        const ts = state.tileSize * state.zoom;
        ctx.strokeStyle = 'rgba(183,243,78,0.22)';
        ctx.lineWidth = 1;
        for (let x = state.offsetX * state.zoom; x <= width * state.zoom; x += ts) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height * state.zoom); ctx.stroke();
        }
        for (let y = state.offsetY * state.zoom; y <= height * state.zoom; y += ts) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width * state.zoom, y); ctx.stroke();
        }
    }

    const cols = Math.ceil((width - state.offsetX) / state.tileSize);
    const rows = Math.ceil((height - state.offsetY) / state.tileSize);
    for (let fy = 0; fy < rows; fy++) {
        for (let fx = 0; fx < cols; fx++) {
            const st = frameState(state.currentFile.path, fx, fy);
            if (st) {
                ctx.fillStyle = st === 'use' ? 'rgba(47,125,50,0.42)' : st === 'skip' ? 'rgba(141,59,59,0.42)' : 'rgba(201,162,39,0.38)';
                ctx.fillRect((state.offsetX + fx * state.tileSize) * state.zoom, (state.offsetY + fy * state.tileSize) * state.zoom, state.tileSize * state.zoom, state.tileSize * state.zoom);
            }
            if (state.edited[f.path] && state.edited[f.path].find((e) => e.x === fx && e.y === fy)) {
                ctx.strokeStyle = 'rgba(78,157,230,0.9)';
                ctx.lineWidth = 2;
                ctx.strokeRect((state.offsetX + fx * state.tileSize) * state.zoom + 1, (state.offsetY + fy * state.tileSize) * state.zoom + 1, state.tileSize * state.zoom - 2, state.tileSize * state.zoom - 2);
            }
        }
    }

    if (state.hoverFrame && state.showGrid) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect((state.offsetX + state.hoverFrame.x * state.tileSize) * state.zoom + 1, (state.offsetY + state.hoverFrame.y * state.tileSize) * state.zoom + 1, state.tileSize * state.zoom - 2, state.tileSize * state.zoom - 2);
    }
    ctx.translate(-state.panX, -state.panY);
}

function frameFromEvent(ev) {
    const canvas = $('#viewer-canvas');
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (mx - state.panX / scaleX) * scaleX;
    const py = (my - state.panY / scaleY) * scaleY;
    const fx = Math.floor((px / scaleX - state.offsetX) / state.tileSize);
    const fy = Math.floor((py / scaleY - state.offsetY) / state.tileSize);
    if (fx < 0 || fy < 0) return null;
    return { x: fx, y: fy };
}

function updateStatus() {
    const f = state.hoverFrame;
    const sb = $('#statusbar');
    if (!state.imageMeta) { sb.textContent = ''; return; }
    if (!f) { sb.textContent = `${state.imageMeta.width}x${state.imageMeta.height} · tile ${state.tileSize}px · zoom ${Math.round(state.zoom * 100)}%`; return; }
    const st = frameState(state.currentFile.path, f.x, f.y);
    const edited = state.edited[state.currentFile.path] && state.edited[state.currentFile.path].find((e) => e.x === f.x && e.y === f.y) ? ' · ✎ editado' : '';
    sb.textContent = `frame (${f.x},${f.y}) · estado: ${st || '—'}${edited} · [1]usar [2]pular [3]fav [0]limpar`;
}

function stopAnim() {
    if (state.animTimer) { clearInterval(state.animTimer); state.animTimer = null; }
    state.animOn = false;
    $('#anim-toggle').classList.remove('on');
}

function startAnim() {
    const meta = state.imageMeta;
    if (!meta) return;
    const cols = Math.ceil((meta.width - state.offsetX) / state.tileSize);
    const rows = Math.ceil((meta.height - state.offsetY) / state.tileSize);
    if (rows < 2 && cols < 2) return;
    state.animOn = true;
    $('#anim-toggle').classList.add('on');
    let frame = 0;
    state.animTimer = setInterval(() => {
        frame = (frame + 1) % cols;
        state.hoverFrame = { x: frame, y: 0 };
        drawCanvas();
        updateStatus();
    }, 150);
}

function fitView() {
    if (!state.imageMeta) return;
    const stage = $('#stage');
    const sw = stage.clientWidth - 40;
    const sh = stage.clientHeight - 40;
    const sx = sw / state.imageMeta.width;
    const sy = sh / state.imageMeta.height;
    state.zoom = Math.max(0.1, Math.min(sx, sy, 6));
    state.panX = 0;
    state.panY = 0;
    drawCanvas();
}

/* ---------------- Pixel editor ---------------- */

const editor = {
    tileSize: 16,
    data: null,          // Uint8Array RGBA tileSize*tileSize
    backup: null,        // original for restore
    undoStack: [],
    redoStack: [],
    tool: 'pencil',
    color: '#ffffff',
    zoom: 16,
    path: null,
    fx: 0,
    fy: 0
};

function openEditor(fx, fy) {
    const p = state.currentFile.path;
    const ts = state.tileSize;
    editor.tileSize = ts;
    editor.path = p;
    editor.fx = fx;
    editor.fy = fy;
    editor.zoom = 16;
    editor.undoStack = [];
    editor.redoStack = [];
    const off = document.createElement('canvas');
    off.width = ts;
    off.height = ts;
    const octx = off.getContext('2d');
    octx.drawImage(state.img, (state.offsetX + fx * ts), (state.offsetY + fy * ts), ts, ts, 0, 0, ts, ts);
    editor.data = octx.getImageData(0, 0, ts, ts).data.slice();
    editor.backup = editor.data.slice();
    $('#editor-title').textContent = `Editar tile (${fx},${fy}) — ${p}`;
    $('#editor-modal').classList.remove('hidden');
    buildPalette();
    renderEditor();
}

function renderEditor() {
    const canvas = $('#editor-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = editor.tileSize * editor.zoom;
    canvas.height = editor.tileSize * editor.zoom;
    ctx.imageSmoothingEnabled = false;
    const img = new ImageData(new Uint8ClampedArray(editor.data), editor.tileSize, editor.tileSize);
    const off = document.createElement('canvas');
    off.width = editor.tileSize; off.height = editor.tileSize;
    off.getContext('2d').putImageData(img, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    if (editor.zoom >= 12) {
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        for (let i = 1; i < editor.tileSize; i++) {
            ctx.beginPath(); ctx.moveTo(i * editor.zoom, 0); ctx.lineTo(i * editor.zoom, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * editor.zoom); ctx.lineTo(canvas.width, i * editor.zoom); ctx.stroke();
        }
    }
}

function buildPalette() {
    const pal = $('#palette');
    pal.innerHTML = '';
    const colors = new Map();
    for (let i = 0; i < editor.data.length; i += 4) {
        const a = editor.data[i + 3];
        if (a === 0) { colors.set('transparent', 'rgba(0,0,0,0)'); continue; }
        const key = `#${[0, 1, 2].map((k) => editor.data[i + k].toString(16).padStart(2, '0')).join('')}`;
        colors.set(key, key);
    }
    for (const [k, v] of colors) {
        const sw = document.createElement('div');
        sw.className = 'swatch' + (k === editor.color ? ' active' : '');
        sw.style.background = v === 'rgba(0,0,0,0)' ? 'repeating-conic-gradient(#444 0 25%, #222 0 50%) 0 0/10px 10px' : v;
        sw.onclick = () => { editor.color = k; setActiveTool('eyedropper'); $('#color-pick').value = k === 'transparent' ? '#ffffff' : k; $('#palette').querySelectorAll('.swatch').forEach((s) => s.classList.toggle('active', s === sw)); };
        pal.appendChild(sw);
    }
}

function setActiveTool(t) {
    editor.tool = t;
    document.querySelectorAll('.tool-btn').forEach((b) => b.classList.toggle('active', b.dataset.tool === t));
}

function pushUndo() {
    editor.undoStack.push(editor.data.slice());
    if (editor.undoStack.length > 30) editor.undoStack.shift();
    editor.redoStack = [];
}

function setPixel(px, py, color) {
    if (px < 0 || py < 0 || px >= editor.tileSize || py >= editor.tileSize) return;
    const idx = (py * editor.tileSize + px) * 4;
    if (color === 'transparent' || editor.color === 'transparent') {
        editor.data[idx + 3] = 0;
        return;
    }
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    editor.data[idx] = r;
    editor.data[idx + 1] = g;
    editor.data[idx + 2] = b;
    editor.data[idx + 3] = 255;
}

function floodFill(px, py, color) {
    const target = [...editor.data.slice((py * editor.tileSize + px) * 4, (py * editor.tileSize + px) * 4 + 4)];
    const stack = [[px, py]];
    const seen = new Set();
    const match = (idx) => {
        for (let i = 0; i < 4; i++) if (editor.data[idx + i] !== target[i]) return false;
        return true;
    };
    while (stack.length) {
        const [x, y] = stack.pop();
        const k = `${x},${y}`;
        if (seen.has(k) || x < 0 || y < 0 || x >= editor.tileSize || y >= editor.tileSize) continue;
        const idx = (y * editor.tileSize + x) * 4;
        if (!match(idx)) continue;
        seen.add(k);
        setPixel(x, y, color);
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
}

$('#editor-canvas').addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    const rect = ev.target.getBoundingClientRect();
    const px = Math.floor((ev.clientX - rect.left) / editor.zoom);
    const py = Math.floor((ev.clientY - rect.top) / editor.zoom);
    if (px < 0 || py < 0 || px >= editor.tileSize || py >= editor.tileSize) return;
    pushUndo();
    if (editor.tool === 'eyedropper') {
        const idx = (py * editor.tileSize + px) * 4;
        if (editor.data[idx + 3] === 0) { editor.color = 'transparent'; }
        else {
            editor.color = `#${[0, 1, 2].map((k) => editor.data[idx + k].toString(16).padStart(2, '0')).join('')}`;
            $('#color-pick').value = editor.color;
        }
        setActiveTool('pencil');
        renderEditor();
        return;
    }
    if (editor.tool === 'fill') { floodFill(px, py, editor.color); }
    else { setPixel(px, py, editor.color); }
    renderEditor();
});

$('#editor-canvas').addEventListener('mousemove', (ev) => {
    if (ev.buttons !== 1 || editor.tool === 'fill') return;
    const rect = ev.target.getBoundingClientRect();
    const px = Math.floor((ev.clientX - rect.left) / editor.zoom);
    const py = Math.floor((ev.clientY - rect.top) / editor.zoom);
    if (px < 0 || py < 0 || px >= editor.tileSize || py >= editor.tileSize) return;
    setPixel(px, py, editor.color);
    renderEditor();
});

document.querySelectorAll('.tool-btn').forEach((b) => b.onclick = () => setActiveTool(b.dataset.tool));

$('#undo-btn').onclick = () => {
    if (!editor.undoStack.length) return;
    editor.redoStack.push(editor.data.slice());
    editor.data = editor.undoStack.pop();
    renderEditor();
};
$('#redo-btn').onclick = () => {
    if (!editor.redoStack.length) return;
    editor.undoStack.push(editor.data.slice());
    editor.data = editor.redoStack.pop();
    renderEditor();
};
$('#reset-tile-btn').onclick = () => { editor.data = editor.backup.slice(); editor.undoStack = []; editor.redoStack = []; renderEditor(); };
$('#editor-zoom').oninput = (ev) => { editor.zoom = Number(ev.target.value); renderEditor(); };
$('#color-pick').oninput = (ev) => { editor.color = ev.target.value; setActiveTool('pencil'); };

async function saveTile() {
    const ts = editor.tileSize;
    const off = document.createElement('canvas');
    off.width = ts; off.height = ts;
    const octx = off.getContext('2d');
    octx.putImageData(new ImageData(new Uint8ClampedArray(editor.data), ts, ts), 0, 0);
    const dataUrl = off.toDataURL('image/png');
    await api('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: editor.path, x: editor.fx, y: editor.fy, tileSize: ts, dataUrl })
    });
    state.edited[editor.path] = await api(`/api/edited?p=${encodeURIComponent(editor.path)}`);
    $('#editor-modal').classList.add('hidden');
    drawCanvas();
    renderGallery();
    toast('Tile salvo em assets-cc0/_edited/');
}

$('#editor-save').onclick = saveTile;
$('#editor-cancel').onclick = () => $('#editor-modal').classList.add('hidden');
$('#editor-close').onclick = () => $('#editor-modal').classList.add('hidden');
$('#edit-tile-btn').onclick = () => {
    if (!state.currentFile || !state.imageMeta) return toast('Abra uma imagem primeiro');
    const f = state.hoverFrame || { x: 0, y: 0 };
    openEditor(f.x, f.y);
};

/* ---------------- Wire up ---------------- */

$('#viewer-canvas').addEventListener('mousemove', (ev) => {
    if (!state.imageMeta) return;
    state.hoverFrame = frameFromEvent(ev);
    drawCanvas();
    updateStatus();
});
$('#viewer-canvas').addEventListener('click', (ev) => {
    if (!state.imageMeta) return;
    const f = frameFromEvent(ev);
    if (!f) return;
    const cur = frameState(state.currentFile.path, f.x, f.y);
    const next = cur === '' ? 'use' : cur === 'use' ? 'skip' : cur === 'skip' ? 'fav' : '';
    setFrameState(state.currentFile.path, f.x, f.y, next);
    drawCanvas();
    updateStatus();
    updateStats();
});
$('#viewer-canvas').addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const delta = ev.deltaY > 0 ? -0.15 : 0.15;
    state.zoom = Math.min(8, Math.max(0.1, state.zoom + delta));
    drawCanvas();
    updateStatus();
}, { passive: false });
$('#viewer-canvas').addEventListener('dblclick', () => {
    if (!state.imageMeta || !state.hoverFrame) return;
    openEditor(state.hoverFrame.x, state.hoverFrame.y);
});
document.addEventListener('keydown', (ev) => {
    if (!$('#editor-modal').classList.contains('hidden')) return;
    if (!state.currentFile || !state.imageMeta || !state.hoverFrame) return;
    const map = { '1': 'use', '2': 'skip', '3': 'fav', '0': '' };
    if (map[ev.key] !== undefined) {
        setFrameState(state.currentFile.path, state.hoverFrame.x, state.hoverFrame.y, map[ev.key]);
        drawCanvas(); updateStatus(); updateStats();
    }
});

$('#back-btn').onclick = () => {
    stopAnim();
    $('#viewer').classList.add('hidden');
    $('#gallery').classList.remove('hidden');
    state.currentFile = null;
    renderGallery();
    renderCrumbs();
};
$('#save-btn').onclick = async () => {
    await api('/api/selection', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state.selection) });
    toast('Seleção salva em assets-cc0/selection.json');
};
$('#tile-size').onchange = (ev) => { state.tileSize = Number(ev.target.value) || 16; stopAnim(); drawCanvas(); updateStatus(); };
$('#offset-x').onchange = (ev) => { state.offsetX = Number(ev.target.value) || 0; drawCanvas(); };
$('#offset-y').onchange = (ev) => { state.offsetY = Number(ev.target.value) || 0; drawCanvas(); };
$('#grid-toggle').onclick = () => { state.showGrid = !state.showGrid; $('#grid-toggle').classList.toggle('on', state.showGrid); drawCanvas(); };
$('#anim-toggle').onclick = () => { state.animOn ? stopAnim() : startAnim(); };
$('#zoom-in').onclick = () => { state.zoom = Math.min(8, state.zoom * 1.4); drawCanvas(); };
$('#zoom-out').onclick = () => { state.zoom = Math.max(0.1, state.zoom / 1.4); drawCanvas(); };
$('#fit-btn').onclick = fitView;
$('#search').oninput = (ev) => { state.search = ev.target.value; renderTree(); renderGallery(); };

function renderCrumbs() {
    const c = $('#crumbs');
    const parts = state.currentFile ? state.currentFile.path.split('/') : state.currentDir.split('/').filter(Boolean);
    c.innerHTML = '';
    let acc = '';
    c.appendChild(makeCrumb('home', '', acc));
    for (const p of parts) {
        acc = acc ? acc + '/' + p : p;
        c.appendChild(document.createTextNode(' / '));
        c.appendChild(makeCrumb(p, acc, acc));
    }
}
function makeCrumb(label, path, upTo) {
    const s = document.createElement('span');
    s.className = 'crumb';
    s.textContent = label;
    s.onclick = () => { state.currentDir = path; state.currentFile = null; $('#viewer').classList.add('hidden'); $('#gallery').classList.remove('hidden'); renderTree(); renderGallery(); renderCrumbs(); };
    return s;
}

function updateStats() {
    const counts = { use: 0, skip: 0, fav: 0, total: 0 };
    for (const v of Object.values(state.selection.frames)) counts[v] = (counts[v] || 0) + 1;
    for (const v of Object.values(state.selection.files)) counts[v] = (counts[v] || 0) + 1;
    counts.total = Object.keys(state.selection.frames).length + Object.keys(state.selection.files).length;
    $('#stats').textContent = `marcados: ${counts.total} · usar: ${counts.use} · pular: ${counts.skip} · fav: ${counts.fav}`;
}

let toastTimer;
function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
}

async function init() {
    const [treeRes, selRes] = await Promise.all([api('/api/tree'), api('/api/selection')]);
    state.tree = treeRes.tree;
    state.selection = selRes;
    renderTree();
    renderGallery();
}

init();
