const PAGE_SIZE = 48;

const state = {
    group: '',
    type: '',
    q: '',
    page: 1,
    selected: {},
    groups: [],
    pageAssets: [],
    total: 0
};

const $ = id => document.getElementById(id);

async function api(url, options = {})
{
    let res = await fetch(url, {
        headers: {'Content-Type': 'application/json'},
        ...options
    });
    let data = await res.json();
    if(!res.ok){
        throw new Error(data.error || res.statusText);
    }
    return data;
}

function toast(msg, isError = false)
{
    let el = $('toast');
    el.textContent = msg;
    el.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3500);
}

function fmtSize(bytes)
{
    if(bytes < 1024){ return bytes + ' B'; }
    if(bytes < 1048576){ return (bytes / 1024).toFixed(0) + ' KB'; }
    return (bytes / 1048576).toFixed(1) + ' MB';
}

async function loadStats()
{
    try {
        let s = await api('/api/stats');
        $('stat-total').innerHTML = `<b>${s.totalAssets}</b> assets`;
        $('stat-selected').innerHTML = `<b>${s.selected}</b> selecionados`;
        $('stat-audio').innerHTML = `<b>${s.selectedAudio}</b> áudio`;
    } catch (e) {
        toast('Erro ao carregar stats: ' + e.message, true);
    }
}

async function loadGroups()
{
    let data = await api('/api/packs');
    state.groups = data.groups;
    let list = $('pack-list');
    list.innerHTML = '';
    for(let group of data.groups){
        let c = group.counts;
        let item = document.createElement('div');
        item.className = 'pack-item' + (state.group === group.name ? ' active' : '');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = state.group === group.name;
        checkbox.addEventListener('click', ev => {
            ev.stopPropagation();
            toggleGroup(group.name);
        });
        let name = document.createElement('span');
        name.className = 'pack-name';
        name.textContent = group.name;
        name.title = group.name;
        let count = document.createElement('span');
        count.className = 'pack-count';
        count.textContent = c.total;
        item.append(checkbox, name, count);
        item.addEventListener('click', () => {
            state.group = state.group === group.name ? '' : group.name;
            state.page = 1;
            renderGroups();
            loadAssets();
        });
        list.appendChild(item);
    }
}

function renderGroups()
{
    let items = $('pack-list').children;
    for(let item of items){
        let checkbox = item.querySelector('input');
        let name = item.querySelector('.pack-name').textContent;
        item.classList.toggle('active', state.group === name);
        checkbox.checked = state.group === name;
    }
}

async function toggleGroup(groupName)
{
    let data = await api('/api/assets?group=' + encodeURIComponent(groupName) + '&pageSize=100000');
    let rels = data.assets.map(a => a.relPath);
    let anyUnselected = rels.some(r => !state.selected[r]);
    await api('/api/selection/bulk', {
        method: 'POST',
        body: JSON.stringify({relPaths: rels, selected: anyUnselected})
    });
    for(let r of rels){
        if(anyUnselected){
            state.selected[r] = true;
        } else {
            delete state.selected[r];
        }
    }
    loadStats();
    renderGrid();
    toast((anyUnselected ? 'Selecionados' : 'Desmarcados') + ' ' + rels.length + ' assets de ' + groupName);
}

async function loadAssets()
{
    $('grid').innerHTML = '<div class="loading">Carregando...</div>';
    let params = new URLSearchParams({page: state.page, pageSize: PAGE_SIZE});
    if(state.group){ params.set('group', state.group); }
    if(state.type){ params.set('type', state.type); }
    if(state.q){ params.set('q', state.q); }
    let data = await api('/api/assets?' + params.toString());
    state.pageAssets = data.assets;
    state.total = data.total;
    $('page-info').textContent = `${data.page} / ${Math.max(1, Math.ceil(data.total / PAGE_SIZE))} (${data.total})`;
    $('btn-prev').disabled = data.page <= 1;
    $('btn-next').disabled = data.page * PAGE_SIZE >= data.total;
    $('result-count').textContent = data.total + ' resultados';
    renderGrid();
}

function renderGrid()
{
    let grid = $('grid');
    grid.innerHTML = '';
    for(let asset of state.pageAssets){
        let card = document.createElement('div');
        card.className = 'card' + (asset.selected ? ' selected' : '');
        card.dataset.relPath = asset.relPath;

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'check';
        checkbox.checked = asset.selected;
        checkbox.addEventListener('change', () => toggleAsset(asset.relPath, checkbox.checked, card));

        let preview = document.createElement('div');
        preview.className = 'preview';
        if(asset.type === 'image'){
            let img = document.createElement('img');
            img.loading = 'lazy';
            img.src = '/file?path=' + encodeURIComponent(asset.relPath);
            img.alt = asset.name;
            preview.appendChild(img);
        } else if(asset.type === 'audio'){
            preview.classList.add('audio');
            let audio = document.createElement('audio');
            audio.controls = true;
            audio.preload = 'none';
            audio.src = '/file?path=' + encodeURIComponent(asset.relPath);
            preview.appendChild(audio);
        } else {
            let icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.textContent = asset.type === 'map' ? '🗺' : '📄';
            preview.appendChild(icon);
        }

        let meta = document.createElement('div');
        meta.className = 'meta';
        let name = document.createElement('div');
        name.className = 'name';
        name.textContent = asset.name;
        name.title = asset.relPath;
        let pathEl = document.createElement('div');
        pathEl.className = 'path';
        pathEl.textContent = asset.pack + ' · ' + fmtSize(asset.size);
        meta.append(name, pathEl);

        card.append(checkbox, preview, meta);
        card.addEventListener('click', ev => {
            if(ev.target.tagName !== 'INPUT' && ev.target.tagName !== 'AUDIO'){
                checkbox.checked = !checkbox.checked;
                toggleAsset(asset.relPath, checkbox.checked, card);
            }
        });
        grid.appendChild(card);
    }
}

async function toggleAsset(relPath, selected, card)
{
    try {
        await api('/api/selection/toggle', {
            method: 'POST',
            body: JSON.stringify({relPath, selected})
        });
        if(selected){
            state.selected[relPath] = true;
            card.classList.add('selected');
        } else {
            delete state.selected[relPath];
            card.classList.remove('selected');
        }
        loadStats();
    } catch (e) {
        toast('Erro: ' + e.message, true);
        checkbox.checked = !selected;
    }
}

function toggleVisible(selected)
{
    let rels = state.pageAssets.map(a => a.relPath);
    api('/api/selection/bulk', {
        method: 'POST',
        body: JSON.stringify({relPaths: rels, selected})
    }).then(() => {
        for(let r of rels){
            if(selected){
                state.selected[r] = true;
            } else {
                delete state.selected[r];
            }
        }
        loadStats();
        renderGrid();
    }).catch(e => toast('Erro: ' + e.message, true));
}

function setupEvents()
{
    let debounce;
    $('search').addEventListener('input', ev => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            state.q = ev.target.value.trim();
            state.page = 1;
            loadAssets();
        }, 300);
    });
    $('type-filter').addEventListener('change', ev => {
        state.type = ev.target.value;
        state.page = 1;
        loadAssets();
    });
    $('btn-select-visible').addEventListener('click', () => toggleVisible(true));
    $('btn-clear-visible').addEventListener('click', () => toggleVisible(false));
    $('btn-prev').addEventListener('click', () => {
        state.page = Math.max(1, state.page - 1);
        loadAssets();
    });
    $('btn-next').addEventListener('click', () => {
        state.page++;
        loadAssets();
    });
    $('btn-apply').addEventListener('click', async () => {
        $('btn-apply').disabled = true;
        try {
            let result = await api('/api/apply', {method: 'POST', body: '{}'});
            toast(`Aplicado: ${result.written.length} arquivos copiados` + (result.sqlCount ? ` · ${result.sqlCount} linhas SQL de áudio em ${result.sqlFile}` : ''));
        } catch (e) {
            toast('Falha ao aplicar: ' + e.message, true);
        } finally {
            $('btn-apply').disabled = false;
        }
    });
    $('btn-cleanup').addEventListener('click', async () => {
        try {
            let result = await api('/api/cleanup', {method: 'POST', body: '{}'});
            toast('Removidos ' + result.removed + ' arquivos aplicados');
        } catch (e) {
            toast('Falha: ' + e.message, true);
        }
    });
}

(async function init()
{
    setupEvents();
    try {
        await loadGroups();
        await loadAssets();
        await loadStats();
    } catch (e) {
        $('grid').innerHTML = `<div class="loading">Erro ao iniciar: ${e.message}</div>`;
        toast('Erro ao iniciar: ' + e.message, true);
    }
})();
