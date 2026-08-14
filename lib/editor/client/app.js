/**
 *
 * Reldens - Editor Client
 *
 * Shell with two views: Assets (iframe to the asset browser) and Mapas
 * (tile painter). The painter builds a Tiled-compatible JSON map with a
 * single ground layer and one tileset, saved to theme/default/assets/maps.
 *
 */

(function () {
    'use strict';

    const MAPS_API = '/editor/api/maps';
    const ASSET_FILE = '/editor/asset-browser/api/file';
    const FILE_API = '/editor/api/maps/file';

    const refs = {
        tabAssets: document.getElementById('tab-assets'),
        tabMaps: document.getElementById('tab-maps'),
        viewAssets: document.getElementById('view-assets'),
        viewMaps: document.getElementById('view-maps'),
        close: document.getElementById('ed-close'),
        version: document.getElementById('ed-version'),
        name: document.getElementById('map-name'),
        width: document.getElementById('map-width'),
        height: document.getElementById('map-height'),
        tile: document.getElementById('map-tile'),
        tileset: document.getElementById('map-tileset'),
        btnNew: document.getElementById('btn-new'),
        btnSave: document.getElementById('btn-save'),
        status: document.getElementById('map-status'),
        mapList: document.getElementById('map-list'),
        mapCanvas: document.getElementById('map-canvas'),
        paletteCanvas: document.getElementById('palette-canvas'),
        paletteInfo: document.getElementById('palette-info')
    };

    const state = {
        map: null,
        tileset: null,
        image: null,
        imageWidth: 0,
        imageHeight: 0,
        selectedGid: 0,
        painting: false,
        erase: false
    };

    function setStatus(text) {
        refs.status.textContent = text;
    }

    function switchTab(tab) {
        let assets = tab === 'assets';
        refs.tabAssets.classList.toggle('active', assets);
        refs.tabMaps.classList.toggle('active', !assets);
        refs.viewAssets.classList.toggle('active', assets);
        refs.viewMaps.classList.toggle('active', !assets);
    }

    function notifyParentClose() {
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'reldens-editor-close' }, '*');
            return;
        }
        window.history.back();
    }

    async function api(url, opts) {
        let res = await fetch(url, opts);
        if (!res.ok) {
            throw new Error((await res.text()) || res.statusText);
        }
        return res.json();
    }

    function mapContext() {
        let ctx = refs.mapCanvas.getContext('2d');
        return ctx;
    }

    function tileFromImage(gid, tw, th, ctx) {
        let cols = Math.max(1, Math.floor(state.imageWidth / tw));
        let index = gid - 1;
        if (index < 0) {
            return false;
        }
        let sx = (index % cols) * tw;
        let sy = Math.floor(index / cols) * th;
        return { sx, sy };
    }

    function renderMap() {
        let map = state.map;
        let ctx = mapContext();
        if (!map || !ctx) {
            return;
        }
        let tw = map.tilewidth;
        let th = map.tileheight;
        refs.mapCanvas.width = map.width * tw;
        refs.mapCanvas.height = map.height * th;
        ctx.fillStyle = '#12161c';
        ctx.fillRect(0, 0, refs.mapCanvas.width, refs.mapCanvas.height);
        if (!state.image) {
            return;
        }
        let data = map.layers[0].data;
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                let gid = data[y * map.width + x];
                if (!gid) {
                    continue;
                }
                let t = tileFromImage(gid, tw, th, ctx);
                if (!t) {
                    continue;
                }
                ctx.drawImage(state.image, t.sx, t.sy, tw, th, x * tw, y * th, tw, th);
            }
        }
    }

    function renderPalette() {
        let ctx = refs.paletteCanvas.getContext('2d');
        let tw = Number(refs.tile.value) || 16;
        if (!state.image) {
            ctx.clearRect(0, 0, refs.paletteCanvas.width, refs.paletteCanvas.height);
            refs.paletteInfo.textContent = 'Selecione um tileset para carregar.';
            return;
        }
        refs.paletteCanvas.width = state.imageWidth;
        refs.paletteCanvas.height = state.imageHeight;
        ctx.clearRect(0, 0, refs.paletteCanvas.width, refs.paletteCanvas.height);
        ctx.drawImage(state.image, 0, 0);
        let cols = Math.max(1, Math.floor(state.imageWidth / tw));
        let rows = Math.max(1, Math.floor(state.imageHeight / tw));
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * tw);
            ctx.lineTo(state.imageWidth, y * tw);
            ctx.stroke();
        }
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * tw, 0);
            ctx.lineTo(x * tw, state.imageHeight);
            ctx.stroke();
        }
        if (state.selectedGid > 0) {
            let t = tileFromImage(state.selectedGid, tw, tw, ctx);
            if (t) {
                ctx.strokeStyle = '#2f7dff';
                ctx.lineWidth = 2;
                ctx.strokeRect(t.sx + 1, t.sy + 1, tw - 2, tw - 2);
            }
        }
        refs.paletteInfo.textContent = cols + 'x' + rows + ' tiles, tile ' + tw + 'px, gid atual ' + state.selectedGid;
    }

    function mapCursorFromEvent(event) {
        let rect = refs.mapCanvas.getBoundingClientRect();
        let scaleX = refs.mapCanvas.width / rect.width;
        let scaleY = refs.mapCanvas.height / rect.height;
        let x = Math.floor((event.clientX - rect.left) * scaleX / state.map.tilewidth);
        let y = Math.floor((event.clientY - rect.top) * scaleY / state.map.tileheight);
        return { x, y };
    }

    function paletteTileFromEvent(event) {
        let rect = refs.paletteCanvas.getBoundingClientRect();
        let tw = Number(refs.tile.value) || 16;
        let x = Math.floor((event.clientX - rect.left) * (refs.paletteCanvas.width / rect.width) / tw);
        let y = Math.floor((event.clientY - rect.top) * (refs.paletteCanvas.height / rect.height) / tw);
        let cols = Math.max(1, Math.floor(state.imageWidth / tw));
        if (x < 0 || y < 0 || x >= cols) {
            return 0;
        }
        let gid = y * cols + x + 1;
        let rows = Math.max(1, Math.floor(state.imageHeight / tw));
        if (gid > rows * cols) {
            return 0;
        }
        return gid;
    }

    function paintAt(x, y, gid) {
        let map = state.map;
        if (!map || x < 0 || y < 0 || x >= map.width || y >= map.height) {
            return;
        }
        map.layers[0].data[y * map.width + x] = gid;
    }

    function handleMapPointer(event, isPaint) {
        if (!state.map || !state.image) {
            return;
        }
        let pos = mapCursorFromEvent(event);
        let gid = isPaint ? state.selectedGid : 0;
        if (isPaint && gid <= 0) {
            return;
        }
        paintAt(pos.x, pos.y, gid);
        renderMap();
    }

    function loadTileset(path) {
        let url;
        if (path.indexOf('/') === -1) {
            url = FILE_API + '?p=maps/' + encodeURIComponent(path);
        } else {
            url = ASSET_FILE + '?p=' + encodeURIComponent(path);
        }
        let img = new Image();
        img.onload = function () {
            state.image = img;
            state.imageWidth = img.naturalWidth;
            state.imageHeight = img.naturalHeight;
            renderPalette();
            renderMap();
        };
        img.onerror = function () {
            setStatus('Falha ao carregar tileset: ' + path);
        };
        img.src = url;
    }

    function newMap() {
        let width = Math.max(4, Number(refs.width.value) || 24);
        let height = Math.max(4, Number(refs.height.value) || 24);
        let tw = Math.max(4, Number(refs.tile.value) || 32);
        let tilesetPath = refs.tileset.value || '';
        state.map = {
            type: 'map',
            orientation: 'orthogonal',
            renderorder: 'right-down',
            infinite: false,
            width,
            height,
            tilewidth: tw,
            tileheight: tw,
            nextlayerid: 2,
            nextobjectid: 1,
            tilesets: [{
                firstgid: 1,
                name: tilesetPath.split('/').pop() || 'tileset',
                image: tilesetPath.split('/').pop() || '',
                tilewidth: tw,
                tileheight: tw,
                imagewidth: state.imageWidth || 0,
                imageheight: state.imageHeight || 0
            }],
            layers: [{
                id: 1,
                name: 'ground',
                type: 'tilelayer',
                x: 0,
                y: 0,
                width,
                height,
                opacity: 1,
                visible: true,
                data: new Array(width * height).fill(0)
            }]
        };
        if (tilesetPath) {
            loadTileset(tilesetPath);
        }
        renderMap();
        setStatus('Novo mapa criado.');
    }

    function loadMapInto(name) {
        api(MAPS_API + '/' + encodeURIComponent(name)).then(function (map) {
            state.map = map;
            refs.width.value = map.width;
            refs.height.value = map.height;
            refs.tile.value = map.tilewidth;
            refs.name.value = name;
            let tileset = map.tilesets && map.tilesets.length ? map.tilesets[0] : null;
            let imageName = tileset ? tileset.image : '';
            let option = refs.tileset.querySelector('option[value="' + imageName.replace(/"/g, '\\"') + '"]');
            if (imageName && option) {
                refs.tileset.value = option.value;
            }
            if (imageName) {
                loadTileset(imageName);
            } else {
                renderMap();
            }
            setStatus('Mapa ' + name + ' carregado.');
        }).catch(function () {
            setStatus('Falha ao carregar mapa ' + name + '.');
        });
    }

    function renderMapList(maps) {
        refs.mapList.innerHTML = '';
        for (let map of maps) {
            let item = document.createElement('div');
            item.className = 'map-list-item';
            item.textContent = map.name;
            let info = document.createElement('small');
            info.textContent = map.width + 'x' + map.height + ', tile ' + map.tilewidth + ', ' + map.layers.length + ' camadas';
            item.appendChild(info);
            item.addEventListener('click', function () {
                loadMapInto(map.name);
            });
            refs.mapList.appendChild(item);
        }
    }

    function renderTilesets(tilesets) {
        refs.tileset.innerHTML = '';
        for (let tileset of tilesets) {
            let option = document.createElement('option');
            option.value = tileset.path;
            option.textContent = (tileset.source === 'maps' ? 'mapa: ' : '') + tileset.name;
            refs.tileset.appendChild(option);
        }
    }

    function saveMap() {
        if (!state.map) {
            setStatus('Crie um novo mapa primeiro.');
            return;
        }
        let name = refs.name.value.trim();
        if (!name) {
            setStatus('Informe um nome para o mapa.');
            return;
        }
        let map = JSON.parse(JSON.stringify(state.map));
        map.width = state.map.width;
        map.height = state.map.height;
        let tilesetPath = refs.tileset.value || '';
        if (map.tilesets.length) {
            map.tilesets[0].imagewidth = state.imageWidth || map.tilesets[0].imagewidth;
            map.tilesets[0].imageheight = state.imageHeight || map.tilesets[0].imageheight;
            map.tilesets[0].columns = Math.max(1, Math.floor((state.imageWidth || 0) / map.tilewidth));
        }
        api(MAPS_API + '/save', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, tilesetPath, map })
        }).then(function (result) {
            setStatus('Mapa salvo: ' + result.file);
            loadMaps();
        }).catch(function (err) {
            setStatus('Falha ao salvar: ' + err.message);
        });
    }

    function loadMaps() {
        api(MAPS_API).then(function (data) {
            renderMapList(data.maps || []);
        }).catch(function () {
            setStatus('Falha ao listar mapas.');
        });
    }

    function loadTilesets() {
        api(MAPS_API + '/tilesets').then(function (data) {
            renderTilesets(data.tilesets || []);
        }).catch(function () {
            setStatus('Falha ao listar tilesets.');
        });
    }

    function init() {
        refs.version.textContent = 'v1';
        switchTab('assets');
        refs.tabAssets.addEventListener('click', function () { switchTab('assets'); });
        refs.tabMaps.addEventListener('click', function () { switchTab('maps'); });
        refs.close.addEventListener('click', notifyParentClose);
        refs.btnNew.addEventListener('click', newMap);
        refs.btnSave.addEventListener('click', saveMap);
        refs.tileset.addEventListener('change', function () {
            if (refs.tileset.value) {
                loadTileset(refs.tileset.value);
            }
        });
        refs.mapCanvas.addEventListener('mousedown', function (event) {
            event.preventDefault();
            state.painting = true;
            state.erase = event.button === 2;
            handleMapPointer(event, !state.erase);
        });
        refs.mapCanvas.addEventListener('mousemove', function (event) {
            if (state.painting) {
                handleMapPointer(event, !state.erase);
            }
        });
        window.addEventListener('mouseup', function () {
            state.painting = false;
        });
        refs.mapCanvas.addEventListener('contextmenu', function (event) {
            event.preventDefault();
        });
        refs.paletteCanvas.addEventListener('click', function (event) {
            let gid = paletteTileFromEvent(event);
            if (gid > 0) {
                state.selectedGid = gid;
                renderPalette();
            }
        });
        loadMaps();
        loadTilesets();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
