/**
 *
 * Reldens - Editor Router
 *
 * Express router mounted at /editor. Serves the editor client shell, mounts
 * the asset browser (tree, image metadata, file preview, selection state) and
 * exposes the map editor API (list, load, tilesets, save).
 *
 * All file reads are restricted to assets-cc0 and the theme maps folder.
 *
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const sharp = require('sharp');
const { Logger, sc } = require('@reldens/utils');
const {
    DEFAULT_TILE_SIZE,
    MAP_EXTENSION,
    MAX_MAP_SIZE,
    TILESET_IMAGE_EXTS
} = require('../constants');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const ASSETS_ROOT = path.join(PROJECT_ROOT, 'assets-cc0');
const SELECTION_FILE = path.join(ASSETS_ROOT, 'selection.json');
const MAPS_DIR = path.join(PROJECT_ROOT, 'theme/default/assets/maps');
const CLIENT_DIR = path.join(__dirname, '../client');
const ASSET_BROWSER_UI_DIR = path.join(PROJECT_ROOT, 'tools/asset-browser/public');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);
const AUDIO_EXT = new Set(['.mp3', '.ogg', '.wav', '.flac']);
const TEXT_EXT = new Set(['.json', '.tmj', '.txt', '.md']);
const SKIP_DIRS = new Set(['_staging', '.git', 'generated']);

const MIME = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.json': 'application/json',
    '.tmj': 'application/json',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf'
};

class EditorRouter
{

    /**
     * @returns {import('express').Router}
     */
    static create()
    {
        let router = express.Router();
        let editor = new EditorRouter();
        router.use(express.json({limit: '20mb'}));
        router.use(express.static(CLIENT_DIR));
        router.use('/asset-browser', editor.assetBrowserRouter());
        router.use('/api/maps', editor.mapsRouter());
        return router;
    }

    assetBrowserRouter()
    {
        let router = express.Router();
        router.use(express.static(ASSET_BROWSER_UI_DIR));

        router.get('/api/tree', (_req, res) => {
            res.json({root: 'assets-cc0', tree: this.walk(ASSETS_ROOT)});
        });

        router.get('/api/image', async (req, res) => {
            let rel = req.query.p;
            if(!this.isSafeRelPath(rel)){
                return res.status(400).send('bad path');
            }
            let full = path.join(ASSETS_ROOT, rel);
            if(!fs.existsSync(full)){
                return res.status(404).send('not found');
            }
            let ext = path.extname(full).toLowerCase();
            if(!IMAGE_EXT.has(ext)){
                return res.status(400).send('not image');
            }
            if('.gif' === ext){
                return res.sendFile(full);
            }
            try {
                let meta = await sharp(full).metadata();
                res.json({path: rel, width: meta.width, height: meta.height, format: meta.format});
            } catch (error) {
                Logger.critical({'Editor asset metadata error': error.message || error, path: rel});
                res.status(500).send(String(error.message || error));
            }
        });

        router.get('/api/file', (req, res) => {
            return this.sendFileFromAssets(req, res);
        });

        router.post('/api/edit', async (req, res) => {
            let rel = sc.get(req.body, 'path', '');
            let action = sc.get(req.body, 'action', '');
            let params = sc.get(req.body, 'params', {});
            if(!this.isSafeRelPath(rel)){
                return res.status(400).send('bad path');
            }
            let full = path.join(ASSETS_ROOT, rel);
            let ext = path.extname(full).toLowerCase();
            if(!IMAGE_EXT.has(ext) || '.gif' === ext){
                return res.status(400).send('unsupported image type');
            }
            if(!fs.existsSync(full)){
                return res.status(404).send('not found');
            }
            let outputName = rel.replace(ext, '');
            try {
                let pipeline = sharp(full);
                if('trim' === action){
                    pipeline = pipeline.trim();
                    outputName += '-trim.png';
                } else if('resize' === action){
                    let width = Number(sc.get(params, 'width', 0) || 0);
                    let height = Number(sc.get(params, 'height', 0) || 0);
                    if(width <= 0 && height <= 0){
                        return res.status(400).send('provide width and/or height');
                    }
                    if(width > 8192 || height > 8192){
                        return res.status(400).send('size too big');
                    }
                    pipeline = pipeline.resize(width > 0 ? width : null, height > 0 ? height : null);
                    outputName += '-resized.png';
                } else if('rotate' === action){
                    pipeline = pipeline.rotate(Number(sc.get(params, 'degrees', 90) || 90));
                    outputName += '-rotated.png';
                } else {
                    return res.status(400).send('unknown action');
                }
                let editedDir = path.join(ASSETS_ROOT, '_edited');
                if(!fs.existsSync(editedDir)){
                    fs.mkdirSync(editedDir, {recursive: true});
                }
                let destFile = path.join(editedDir, path.basename(outputName));
                await pipeline.png().toFile(destFile);
                let meta = await sharp(destFile).metadata();
                res.json({
                    ok: true,
                    path: '_edited/' + path.basename(destFile),
                    width: meta.width,
                    height: meta.height,
                    size: fs.statSync(destFile).size
                });
            } catch (error) {
                Logger.critical({'Editor edit error': error.message || error, path: rel});
                res.status(500).send(String(error.message || error));
            }
        });

        router.get('/api/selection', (_req, res) => {
            res.json(this.loadSelection());
        });

        router.put('/api/selection', (req, res) => {
            let selection = req.body;
            if(!selection || typeof selection !== 'object'){
                return res.status(400).send('bad body');
            }
            selection.version = 1;
            fs.writeFileSync(SELECTION_FILE, JSON.stringify(selection, null, 2));
            res.json({ok: true});
        });

        return router;
    }

    mapsRouter()
    {
        let router = express.Router();

        router.get('/', (_req, res) => {
            let maps = [];
            for(let file of fs.readdirSync(MAPS_DIR)){
                if(!file.endsWith(MAP_EXTENSION)){
                    continue;
                }
                let full = path.join(MAPS_DIR, file);
                try {
                    let map = JSON.parse(fs.readFileSync(full, 'utf8'));
                    maps.push({
                        name: file.replace(MAP_EXTENSION, ''),
                        file,
                        size: fs.statSync(full).size,
                        width: sc.get(map, 'width', 0),
                        height: sc.get(map, 'height', 0),
                        tilewidth: sc.get(map, 'tilewidth', DEFAULT_TILE_SIZE),
                        tileheight: sc.get(map, 'tileheight', DEFAULT_TILE_SIZE),
                        tileset: this.mapTilesetName(map),
                        layers: (map.layers || []).map((layer) => ({
                            name: layer.name,
                            type: layer.type,
                            width: layer.width,
                            height: layer.height
                        }))
                    });
                } catch (error) {
                    Logger.warn('Editor: skipped unparsable map ' + file + '.');
                }
            }
            maps.sort((a, b) => a.name.localeCompare(b.name));
            res.json({maps});
        });

        router.get('/tilesets', (_req, res) => {
            let tilesets = [];
            for(let file of fs.readdirSync(MAPS_DIR)){
                let ext = path.extname(file).toLowerCase();
                if(TILESET_IMAGE_EXTS.has(ext)){
                    tilesets.push({path: file, source: 'maps', name: file, size: fs.statSync(path.join(MAPS_DIR, file)).size});
                }
            }
            for(let entry of this.walk(ASSETS_ROOT)){
                if('image' === entry.type && TILESET_IMAGE_EXTS.has(path.extname(entry.path).toLowerCase())){
                    tilesets.push({path: entry.path, source: 'assets', name: entry.name, size: entry.size});
                }
            }
            res.json({tilesets});
        });

        router.get('/file', (req, res) => {
            let rel = req.query.p;
            if(!rel){
                return res.status(400).send('bad path');
            }
            let allowedRoots = [ASSETS_ROOT, MAPS_DIR];
            let full = path.resolve(rel.startsWith('maps/') ? MAPS_DIR : ASSETS_ROOT, rel.replace(/^maps\//, ''));
            if(!allowedRoots.some((root) => full === root || full.startsWith(root + path.sep)) || !fs.existsSync(full)){
                return res.status(404).send('not found');
            }
            let ext = path.extname(full).toLowerCase();
            res.sendFile(full, {headers: {'Content-Type': MIME[ext] || 'application/octet-stream'}});
        });

        router.get('/:name', (req, res) => {
            let name = this.sanitizeMapName(req.params.name);
            if(!name){
                return res.status(400).send('bad map name');
            }
            let full = path.join(MAPS_DIR, name + MAP_EXTENSION);
            if(!fs.existsSync(full)){
                return res.status(404).send('map not found');
            }
            res.json(JSON.parse(fs.readFileSync(full, 'utf8')));
        });

        router.post('/save', (req, res) => {
            let body = req.body || {};
            let name = this.sanitizeMapName(sc.get(body, 'name', ''));
            let map = body.map;
            if(!name){
                return res.status(400).send('bad map name');
            }
            if(!this.isValidMap(map)){
                return res.status(400).send('invalid map data');
            }
            let tilesetPath = sc.get(body, 'tilesetPath', '');
            if(tilesetPath){
                let copied = this.copyTileset(tilesetPath, map);
                if(!copied){
                    return res.status(400).send('tileset copy failed');
                }
            }
            let full = path.join(MAPS_DIR, name + MAP_EXTENSION);
            fs.writeFileSync(full, JSON.stringify(map, null, 2));
            res.json({ok: true, name, file: name + MAP_EXTENSION});
        });

        return router;
    }

    /**
     * Copy a tileset image into the maps folder and point the map tileset to it.
     *
     * @param {string} tilesetPath
     * @param {Object} map
     * @returns {boolean}
     */
    copyTileset(tilesetPath, map)
    {
        if(!tilesetPath || typeof tilesetPath !== 'string'){
            return false;
        }
        let rel = tilesetPath.replace(/^maps\//, '');
        if(!this.isSafeRelPath(rel)){
            return false;
        }
        let candidates = [
            {root: MAPS_DIR, full: path.join(MAPS_DIR, rel)},
            {root: ASSETS_ROOT, full: path.join(ASSETS_ROOT, rel)}
        ];
        let found = candidates.find((candidate) => fs.existsSync(candidate.full));
        if(!found){
            return false;
        }
        let imageName = path.basename(found.full);
        let dest = path.join(MAPS_DIR, imageName);
        if(!fs.existsSync(dest) || fs.statSync(found.full).size !== fs.statSync(dest).size){
            fs.copyFileSync(found.full, dest);
        }
        if(map.tilesets && map.tilesets.length){
            map.tilesets[0].image = imageName;
        }
        return true;
    }

    /**
     * @param {string} rel
     * @returns {boolean}
     */
    isSafeRelPath(rel)
    {
        if(!rel || typeof rel !== 'string' || rel.includes('..') || rel.startsWith('/') || rel.includes('\\')){
            return false;
        }
        return true;
    }

    /**
     * @param {string} name
     * @returns {string}
     */
    sanitizeMapName(name)
    {
        if(!name || typeof name !== 'string'){
            return '';
        }
        let cleaned = String(name).toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return cleaned.slice(0, 80);
    }

    /**
     * @param {Object} map
     * @returns {boolean}
     */
    isValidMap(map)
    {
        if(!map || typeof map !== 'object'){
            return false;
        }
        let width = Number(map.width);
        let height = Number(map.height);
        let tilewidth = Number(map.tilewidth);
        let tileheight = Number(map.tileheight);
        if(!(width > 0 && height > 0 && width <= MAX_MAP_SIZE && height <= MAX_MAP_SIZE)){
            return false;
        }
        if(!(tilewidth > 0 && tileheight > 0 && tilewidth <= 256 && tileheight <= 256)){
            return false;
        }
        if(!Array.isArray(map.layers) || !map.layers.length){
            return false;
        }
        for(let layer of map.layers){
            if('tilelayer' !== layer.type){
                continue;
            }
            let data = layer.data;
            if(!Array.isArray(data) || data.length !== width * height){
                return false;
            }
            for(let gid of data){
                if(!Number.isInteger(gid) || gid < 0){
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * @param {Object} map
     * @returns {string}
     */
    mapTilesetName(map)
    {
        let tileset = Array.isArray(map.tilesets) ? map.tilesets[0] : false;
        return tileset ? String(tileset.image || tileset.source || '') : '';
    }

    /**
     * @param {Object} file
     * @returns {string}
     */
    assetMime(ext)
    {
        return MIME[ext] || 'application/octet-stream';
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     * @returns {*}
     */
    sendFileFromAssets(req, res)
    {
        let rel = req.query.p;
        if(!this.isSafeRelPath(rel)){
            return res.status(400).send('bad path');
        }
        let full = path.join(ASSETS_ROOT, rel);
        if(!fs.existsSync(full)){
            return res.status(404).send('not found');
        }
        return res.sendFile(full, {headers: {'Content-Type': this.assetMime(path.extname(full).toLowerCase())}});
    }

    /**
     * @returns {Object}
     */
    loadSelection()
    {
        try {
            return JSON.parse(fs.readFileSync(SELECTION_FILE, 'utf8'));
        } catch (error) {
            return {version: 1, frames: {}, files: {}};
        }
    }

    /**
     * @param {string} dir
     * @param {string} [rel]
     * @returns {Array<Object>}
     */
    walk(dir, rel)
    {
        rel = rel || '';
        let entries = [];
        let list = fs.readdirSync(dir, {withFileTypes: true});
        for(let entry of list){
            if(entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)){
                continue;
            }
            let full = path.join(dir, entry.name);
            let relPath = rel ? rel + '/' + entry.name : entry.name;
            if(entry.isDirectory()){
                entries.push({type: 'dir', path: relPath, name: entry.name, children: this.walk(full, relPath)});
                continue;
            }
            let ext = path.extname(entry.name).toLowerCase();
            if(IMAGE_EXT.has(ext) || AUDIO_EXT.has(ext) || TEXT_EXT.has(ext)){
                entries.push({
                    type: IMAGE_EXT.has(ext) ? 'image' : AUDIO_EXT.has(ext) ? 'audio' : 'text',
                    path: relPath,
                    name: entry.name,
                    size: fs.statSync(full).size
                });
            }
        }
        return entries;
    }

}

module.exports.EditorRouter = EditorRouter;
