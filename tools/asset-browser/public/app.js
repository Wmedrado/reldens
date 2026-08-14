const $ = (sel) => document.querySelector(sel);
const state = {
    tree: [],
    currentDir: '',
    currentFile: null,
    imageMeta: null,
    tileSize: 16,
    offsetX: 0,
    offsetY: 0,
    showGrid: true,
    filter: '',
    selection: { version: 1, frames: {}, files: {} },
    hoverFrame: -1,
    img: null,
    audio: null
};

async function api(path, opts) {
    const res = await fetch(path, opts);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

function fileKey(filePath) {
    return filePath.replace(/\\/g, '/');
}

function frameKey(filePath, fx, fy) {
    return `${fileKey(filePath)}#${fx},${fy}`;
}

function stateOf(filePath, frame) {
    if (frame === undefined) return state.selection.files[fileKey(filePath)] || '';
    return state.selection.frames[frameKey(filePath, frame.x, frame.y)] || '';
}

function setState(filePath, frame, value) {
    if (frame === undefined) {
        if (value) state.selection.files[fileKey(filePath)] = value;
        else delete state.selection.files[fileKey(filePath)];
    } else {
        const key = frameKey(filePath, frame.x, frame.y);
        if (value) state.selection.frames[key] = value;
        else delete state.selection.frames[key];
    }
    render();
}

function flattenTree(nodes, prefix, out) {
    for (const n of nodes) {
        if (n.type === 'dir') {
            out.push({ name: n.name, path: n.path, dir: true, count: countFiles(n) });
            flattenTree(n.children || [], n.path, out);
        } else {
            out.push({ name: n.name, path: n.path, dir: false, type: n.type, size: n.size });
        }
    }
    return out;
}

function countFiles(node) {
    let c = 0;
    for (const ch of node.children || []) {
        if (ch.type === 'dir') c += countFiles(ch);
        else c++;
    }
    return c;
}

function renderTree() {
    const el = $('#tree');
    el.innerHTML = '';
    const flat = flattenTree(state.tree, '', []);
    for (const n of flat) {
        const div = document.createElement('div');
        div.className = 'node' + (n.dir ? ' dir' : '') + (n.path === state.currentDir ? ' active' : '');
        if (n.dir) {
            div.textContent = `▸ ${n.name} (${n.count})`;
        } else {
            const st = stateOf(n.path, undefined);
            const badge = st ? `<span class="badge ${st}">${st}</span>` : '';
            div.innerHTML = `&nbsp;&nbsp;${n.name}${badge}`;
        }
        div.onclick = () => { state.currentDir = n.path; renderTree(); renderGrid(); };
        el.appendChild(div);
    }
}

function filesInCurrentDir() {
    const out = [];
    const flat = flattenTree(state.tree, '', []);
    for (const n of flat) {
        if (n.dir) continue;
        if (state.currentDir && !n.path.startsWith(state.currentDir + '/')) continue;
        if (!state.currentDir && n.path.includes('/')) continue;
        out.push(n);
    }
    return out;
}

function passesFilter(f) {
    if (!state.filter) return true;
    const st = stateOf(f.path, undefined);
    if (state.filter === 'unset') return !st;
    return st === state.filter;
}

async function renderGrid() {
    const grid = $('#file-grid');
    grid.innerHTML = '';
    const files = filesInCurrentDir().filter(passesFilter);
    for (const f of files) {
        const card = document.createElement('div');
        card.className = 'card' + (f.type === 'audio' ? ' audio' : '');
        if (f.type === 'image') {
            const img = document.createElement('img');
            img.src = `/api/file?p=${encodeURIComponent(f.path)}`;
            img.loading = 'lazy';
            card.appendChild(img);
        } else if (f.type === 'audio') {
            card.textContent = '🎵';
        }
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = f.name;
        card.appendChild(name);
        const st = stateOf(f.path, undefined);
        if (st) {
            const b = document.createElement('span');
            b.className = 'badge ' + st;
            b.textContent = st;
            card.appendChild(b);
        }
        card.onclick = () => openViewer(f);
        grid.appendChild(card);
    }
    updateStats();
}

async function openViewer(f) {
    state.currentFile = f;
    $('#viewer').classList.remove('hidden');
    $('#file-grid').classList.add('hidden');
    $('#viewer-title').textContent = f.path;
    if (f.type === 'image') {
        state.imageMeta = await api(`/api/image?p=${encodeURIComponent(f.path)}`);
        $('#viewer-dims').textContent = `${state.imageMeta.width}x${state.imageMeta.height}`;
        $('#audio-box').classList.add('hidden');
        loadImage(f);
    } else if (f.type === 'audio') {
        state.imageMeta = null;
        $('#viewer-dims').textContent = '';
        $('#audio-box').classList.remove('hidden');
        $('#audio-player').src = `/api/file?p=${encodeURIComponent(f.path)}`;
        $('#audio-player').play();
        const ctx = $('#viewer-canvas').getContext('2d');
        ctx.clearRect(0, 0, $('#viewer-canvas').width, $('#viewer-canvas').height);
    } else {
        state.imageMeta = null;
    }
}

function loadImage(f) {
    const img = new Image();
    img.onload = () => {
        state.img = img;
        drawCanvas();
    };
    img.src = `/api/file?p=${encodeURIComponent(f.path)}`;
}

function drawCanvas() {
    const canvas = $('#viewer-canvas');
    const ctx = canvas.getContext('2d');
    if (!state.img || !state.imageMeta) return;
    const { width, height } = state.imageMeta;
    const scale = Math.min(1, 900 / width);
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(state.img, 0, 0, canvas.width, canvas.height);
    if (state.showGrid) {
        ctx.strokeStyle = 'rgba(183,243,78,0.35)';
        ctx.lineWidth = 1;
        const ts = state.tileSize * scale;
        for (let x = state.offsetX * scale; x <= canvas.width; x += ts) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = state.offsetY * scale; y <= canvas.height; y += ts) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
    }
    const cols = Math.ceil((width - state.offsetX) / state.tileSize);
    const rows = Math.ceil((height - state.offsetY) / state.tileSize);
    for (let fy = 0; fy < rows; fy++) {
        for (let fx = 0; fx < cols; fx++) {
            const st = stateOf(state.currentFile.path, { x: fx, y: fy });
            if (!st) continue;
            const color = st === 'use' ? 'rgba(47,125,50,0.5)' : st === 'skip' ? 'rgba(141,59,59,0.5)' : 'rgba(201,162,39,0.45)';
            ctx.fillStyle = color;
            ctx.fillRect((state.offsetX + fx * state.tileSize) * scale, (state.offsetY + fy * state.tileSize) * scale, state.tileSize * scale, state.tileSize * scale);
        }
    }
    if (state.hoverFrame >= 0 && state.showGrid) {
        const fx = state.hoverFrame % cols;
        const fy = Math.floor(state.hoverFrame / cols);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect((state.offsetX + fx * state.tileSize) * scale + 1, (state.offsetY + fy * state.tileSize) * scale + 1, state.tileSize * scale - 2, state.tileSize * scale - 2);
    }
}

function updateStats() {
    const counts = { use: 0, skip: 0, fav: 0, total: 0 };
    for (const v of Object.values(state.selection.frames)) counts[v] = (counts[v] || 0) + 1;
    for (const v of Object.values(state.selection.files)) counts[v] = (counts[v] || 0) + 1;
    counts.total = Object.keys(state.selection.frames).length + Object.keys(state.selection.files).length;
    $('#stats').textContent = `marcados: ${counts.total} | usar: ${counts.use} | pular: ${counts.skip} | fav: ${counts.fav}`;
}

async function save() {
    await api('/api/selection', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state.selection) });
    showHint('Seleção salva em assets-cc0/selection.json');
}

function showHint(msg) {
    const h = $('#hint');
    h.textContent = msg;
    h.classList.remove('hidden');
    setTimeout(() => h.classList.add('hidden'), 2500);
}

function canvasFrameFromEvent(ev) {
    const canvas = $('#viewer-canvas');
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    const scale = canvas.width / rect.width;
    const px = mx * scale;
    const py = my * scale;
    const fx = Math.floor((px - state.offsetX) / state.tileSize);
    const fy = Math.floor((py - state.offsetY) / state.tileSize);
    if (fx < 0 || fy < 0) return null;
    return { x: fx, y: fy };
}

function cycleFrameState(frame) {
    const cur = stateOf(state.currentFile.path, frame);
    const next = cur === '' ? 'use' : cur === 'use' ? 'skip' : cur === 'skip' ? 'fav' : '';
    setState(state.currentFile.path, frame, next);
}

function init() {
    $('#viewer-canvas').addEventListener('mousemove', (ev) => {
        if (!state.imageMeta) return;
        const f = canvasFrameFromEvent(ev);
        state.hoverFrame = f ? f.y * Math.ceil((state.imageMeta.width - state.offsetX) / state.tileSize) + f.x : -1;
        drawCanvas();
        $('#frame-info').textContent = f ? `frame (${f.x},${f.y}) — estado: ${stateOf(state.currentFile.path, f) || '—'}` : '';
    });
    $('#viewer-canvas').addEventListener('click', (ev) => {
        if (!state.imageMeta) return;
        const f = canvasFrameFromEvent(ev);
        if (f) cycleFrameState(f);
    });
    $('#back-btn').onclick = () => {
        $('#viewer').classList.add('hidden');
        $('#file-grid').classList.remove('hidden');
        state.currentFile = null;
        state.img = null;
        state.imageMeta = null;
        renderGrid();
    };
    $('#save-btn').onclick = save;
    $('#tile-size').onchange = (ev) => { state.tileSize = Number(ev.target.value) || 16; drawCanvas(); };
    $('#offset-x').onchange = (ev) => { state.offsetX = Number(ev.target.value) || 0; drawCanvas(); };
    $('#offset-y').onchange = (ev) => { state.offsetY = Number(ev.target.value) || 0; drawCanvas(); };
    $('#grid-toggle').onclick = () => { state.showGrid = !state.showGrid; $('#grid-toggle').classList.toggle('on', state.showGrid); drawCanvas(); };
    $('#filter').onchange = (ev) => { state.filter = ev.target.value; renderGrid(); };
    $('#sel-all').onclick = () => {
        if (!state.currentFile) return showHint('Abra um arquivo primeiro');
        if (state.imageMeta) {
            const cols = Math.ceil((state.imageMeta.width - state.offsetX) / state.tileSize);
            const rows = Math.ceil((state.imageMeta.height - state.offsetY) / state.tileSize);
            for (let fy = 0; fy < rows; fy++) for (let fx = 0; fx < cols; fx++) setState(state.currentFile.path, { x: fx, y: fy }, 'use');
        } else {
            setState(state.currentFile.path, undefined, 'use');
        }
    };
    $('#sel-none').onclick = () => {
        if (!state.currentFile) return;
        if (state.imageMeta) {
            const prefix = fileKey(state.currentFile.path) + '#';
            for (const k of Object.keys(state.selection.frames)) if (k.startsWith(prefix)) delete state.selection.frames[k];
        } else {
            delete state.selection.files[fileKey(state.currentFile.path)];
        }
        render();
    };
    document.querySelectorAll('.viewer-actions button.state').forEach((btn) => {
        btn.onclick = () => {
            if (!state.currentFile) return;
            if (state.imageMeta) {
                const cur = stateOf(state.currentFile.path, { x: state.hoverFrame % 1e9, y: Math.floor(state.hoverFrame / 1e9) });
                void cur;
            }
            setState(state.currentFile.path, undefined, btn.dataset.state);
            if (state.imageMeta) {
                const cols = Math.ceil((state.imageMeta.width - state.offsetX) / state.tileSize);
                const rows = Math.ceil((state.imageMeta.height - state.offsetY) / state.tileSize);
                for (let fy = 0; fy < rows; fy++) for (let fx = 0; fx < cols; fx++) setState(state.currentFile.path, { x: fx, y: fy }, btn.dataset.state);
            }
        };
    });
    load();
}

function render() {
    renderTree();
    renderGrid();
    if (state.currentFile && state.imageMeta) drawCanvas();
}

async function load() {
    const [treeRes, selRes] = await Promise.all([api('/api/tree'), api('/api/selection')]);
    state.tree = treeRes.tree;
    state.selection = selRes;
    render();
}

init();
