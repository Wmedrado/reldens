/**
 *
 * Vibecraft Asset Browser — local selection tool
 *
 * Zero-dependency Node HTTP server.
 * Browse assets-cc0 packs, preview images/audio, select each asset the
 * game will use, persist the selection, and apply it to the theme.
 *
 * Port: 8123 (game server stays on 8080).
 *
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../assets-cc0');
const TOOL_DIR = __dirname;
const SELECTION_FILE = path.join(ROOT, 'selection.json');
const MANIFEST_FILE = path.join(ROOT, 'applied-manifest.json');
const GENERATED_DIR = path.join(ROOT, 'generated');
const SQL_FILE = path.join(GENERATED_DIR, 'audio-selection.sql');

const THEME_AUDIO_DIR = path.resolve(__dirname, '../../theme/default/assets/audio');
const THEME_SPRITES_DIR = path.resolve(__dirname, '../../theme/default/assets/custom/sprites');
const THEME_MAPS_DIR = path.resolve(__dirname, '../../theme/default/assets/maps');
const THEME_FONTS_DIR = path.resolve(__dirname, '../../theme/default/assets/fonts');
const THEME_DATA_DIR = path.resolve(__dirname, '../../theme/default/assets/cc0-data');

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);
const AUDIO_EXTS = new Set(['.ogg', '.wav', '.mp3', '.m4a', '.flac', '.aac']);
const MAP_EXTS = new Set(['.json', '.tmj']);
const FONT_EXTS = new Set(['.ttf', '.otf', '.woff', '.woff2']);
const MUSIC_PACKS = new Set(['music-jingles', 'rpg-audio', 'digital-audio']);

const MIME = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.flac': 'audio/flac',
    '.aac': 'audio/aac', '.json': 'application/json', '.tmj': 'application/json',
    '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff',
    '.woff2': 'font/woff2', '.html': 'text/html', '.js': 'text/javascript',
    '.css': 'text/css', '.txt': 'text/plain', '.csv': 'text/csv',
    '.fnt': 'text/plain', '.xml': 'text/xml'
};

function classify(relPath)
{
    let ext = path.extname(relPath).toLowerCase();
    if(IMAGE_EXTS.has(ext)){ return 'image'; }
    if(AUDIO_EXTS.has(ext)){ return 'audio'; }
    if(MAP_EXTS.has(ext)){ return 'map'; }
    if(FONT_EXTS.has(ext)){ return 'font'; }
    return 'data';
}

let scanCache = null;
let scanCacheTime = 0;
const SCAN_TTL = 30000;

function scan()
{
    let now = Date.now();
    if(scanCache && (now - scanCacheTime) < SCAN_TTL){ return scanCache; }
    let packs = [];
    let entries = [];
    let topLevels = fs.readdirSync(ROOT, {withFileTypes: true})
        .filter(d => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'generated');
    for(let packDir of topLevels){
        let packRoot = path.join(ROOT, packDir.name);
        let counts = {image: 0, audio: 0, map: 0, font: 0, data: 0, total: 0};
        let walk = (dir) => {
            let list = fs.readdirSync(dir, {withFileTypes: true});
            for(let ent of list){
                let full = path.join(dir, ent.name);
                if(ent.isDirectory()){
                    walk(full);
                    continue;
                }
                let ext = path.extname(ent.name).toLowerCase();
                if(!MIME[ext]){ continue; }
                let rel = path.relative(ROOT, full).split(path.sep).join('/');
                let type = classify(rel);
                counts[type] = (counts[type] || 0) + 1;
                counts.total++;
                let stat = fs.statSync(full);
                entries.push({
                    relPath: rel,
                    pack: packDir.name,
                    name: ent.name,
                    type,
                    ext: ext.slice(1),
                    size: stat.size
                });
            }
        };
        walk(packRoot);
        packs.push({name: packDir.name, counts});
    }
    scanCache = {packs, entries};
    scanCacheTime = now;
    return scanCache;
}

function loadSelection()
{
    if(!fs.existsSync(SELECTION_FILE)){ return {}; }
    try {
        return JSON.parse(fs.readFileSync(SELECTION_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveSelection(selection)
{
    fs.writeFileSync(SELECTION_FILE, JSON.stringify(selection, null, 2));
}

function slugify(name)
{
    return name.toLowerCase()
        .replace(/\.(ogg|wav|mp3|m4a|flac|aac)$/i, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function escapeSql(value)
{
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "''");
}

function generateAudioSql(selection, entries)
{
    let lines = [];
    for(let relPath of Object.keys(selection)){
        if(!selection[relPath]){ continue; }
        let entry = entries.find(e => e.relPath === relPath);
        if(!entry || entry.type !== 'audio'){ continue; }
        let audioKey = slugify(entry.pack + '-' + entry.name);
        if(!audioKey){ continue; }
        let categoryId = MUSIC_PACKS.has(entry.pack) ? 1 : 3;
        let relDir = path.posix.dirname(relPath);
        let filesName = relDir === '.' ? entry.name : relDir + '/' + entry.name;
        lines.push(
            `INSERT INTO \`audio\` (\`audio_key\`, \`files_name\`, \`category_id\`, \`enabled\`) VALUES ` +
            `('${escapeSql(audioKey)}', '${escapeSql(filesName)}', ${categoryId}, 1) ` +
            `ON DUPLICATE KEY UPDATE \`files_name\` = VALUES(\`files_name\`), \`category_id\` = VALUES(\`category_id\`), \`enabled\` = 1;`
        );
    }
    return lines.join('\n');
}

function applySelection(selection, entries)
{
    let written = [];
    let skipped = [];
    let manifest = {appliedAt: new Date().toISOString(), files: []};
    let targets = [
        {type: 'audio', dest: THEME_AUDIO_DIR},
        {type: 'image', dest: THEME_SPRITES_DIR},
        {type: 'map', dest: THEME_MAPS_DIR},
        {type: 'font', dest: THEME_FONTS_DIR}
    ];
    for(let relPath of Object.keys(selection)){
        if(!selection[relPath]){ continue; }
        let entry = entries.find(e => e.relPath === relPath);
        if(!entry){ skipped.push({relPath, reason: 'not indexed'}); continue; }
        let target = targets.find(t => t.type === entry.type);
        let relDir = path.posix.dirname(relPath);
        let sub = relDir === '.' ? '' : relDir;
        let destDir = target
            ? path.join(target.dest, 'cc0', sub)
            : path.join(THEME_DATA_DIR, 'cc0', sub);
        let destFile = path.join(destDir, entry.name);
        fs.mkdirSync(destDir, {recursive: true});
        fs.copyFileSync(path.join(ROOT, relPath), destFile);
        written.push({relPath, type: entry.type, to: path.relative(path.resolve(__dirname, '../../theme'), destFile)});
        manifest.files.push({relPath, to: path.relative(path.resolve(__dirname, '../../theme'), destFile), type: entry.type});
    }
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
    let sql = generateAudioSql(selection, entries);
    if(sql){
        fs.mkdirSync(GENERATED_DIR, {recursive: true});
        fs.writeFileSync(SQL_FILE, sql + '\n');
    }
    return {written, skipped, sqlCount: sql ? sql.split('\n').length : 0, sqlFile: sql ? path.relative(ROOT, SQL_FILE) : null};
}

function cleanupApplied()
{
    if(!fs.existsSync(MANIFEST_FILE)){ return {removed: 0}; }
    let manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    let themeRoot = path.resolve(__dirname, '../../theme');
    let removed = 0;
    for(let file of manifest.files){
        let full = path.join(themeRoot, file.to);
        if(fs.existsSync(full)){
            fs.unlinkSync(full);
            removed++;
        }
    }
    fs.rmSync(MANIFEST_FILE, {force: true});
    return {removed};
}

function sendJson(res, status, data)
{
    let body = JSON.stringify(data);
    res.writeHead(status, {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)});
    res.end(body);
}

function readBody(req)
{
    return new Promise((resolve, reject) => {
        let chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
            try {
                let raw = Buffer.concat(chunks).toString('utf8');
                resolve(raw ? JSON.parse(raw) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    let url = new URL(req.url, 'http://localhost');
    let pathname = url.pathname;

    try {
        // Static tool files
        if(pathname === '/'){
            let html = fs.readFileSync(path.join(TOOL_DIR, 'index.html'));
            res.writeHead(200, {'Content-Type': 'text/html'});
            return res.end(html);
        }
        if(['/app.js', '/style.css'].includes(pathname)){
            let file = fs.readFileSync(path.join(TOOL_DIR, pathname.slice(1)));
            let ext = path.extname(pathname);
            res.writeHead(200, {'Content-Type': MIME[ext] || 'text/plain'});
            return res.end(file);
        }

        // File preview
        if(pathname === '/file'){
            let rel = url.searchParams.get('path') || '';
            let full = path.resolve(ROOT, rel);
            if(!full.startsWith(path.resolve(ROOT)) || !fs.existsSync(full)){
                return sendJson(res, 404, {error: 'file not found'});
            }
            let ext = path.extname(full).toLowerCase();
            let stat = fs.statSync(full);
            res.writeHead(200, {
                'Content-Type': MIME[ext] || 'application/octet-stream',
                'Content-Length': stat.size,
                'Accept-Ranges': 'bytes'
            });
            return fs.createReadStream(full).pipe(res);
        }

        // API
        if(pathname === '/api/packs'){
            let {packs} = scan();
            return sendJson(res, 200, {packs});
        }

        if(pathname === '/api/assets'){
            let {entries} = scan();
            let selection = loadSelection();
            let pack = url.searchParams.get('pack') || '';
            let type = url.searchParams.get('type') || '';
            let q = (url.searchParams.get('q') || '').toLowerCase();
            let page = parseInt(url.searchParams.get('page') || '1', 10);
            let pageSize = parseInt(url.searchParams.get('pageSize') || '48', 10);
            let filtered = entries.filter(e => {
                if(pack && e.pack !== pack){ return false; }
                if(type && e.type !== type){ return false; }
                if(q && e.relPath.toLowerCase().indexOf(q) === -1){ return false; }
                return true;
            });
            let total = filtered.length;
            let start = (page - 1) * pageSize;
            let slice = filtered.slice(start, start + pageSize).map(e => ({
                relPath: e.relPath, pack: e.pack, name: e.name,
                type: e.type, ext: e.ext, size: e.size,
                selected: !!selection[e.relPath]
            }));
            return sendJson(res, 200, {total, page, pageSize, assets: slice});
        }

        if(pathname === '/api/selection'){
            return sendJson(res, 200, {selection: loadSelection()});
        }

        if(pathname === '/api/selection/toggle' && req.method === 'POST'){
            let body = await readBody(req);
            let selection = loadSelection();
            let rel = body.relPath;
            let selected = !!body.selected;
            if(selected){
                selection[rel] = true;
            } else {
                delete selection[rel];
            }
            saveSelection(selection);
            return sendJson(res, 200, {ok: true, selected});
        }

        if(pathname === '/api/selection/bulk' && req.method === 'POST'){
            let body = await readBody(req);
            let selection = loadSelection();
            let rels = body.relPaths || [];
            for(let rel of rels){
                if(body.selected){
                    selection[rel] = true;
                } else {
                    delete selection[rel];
                }
            }
            saveSelection(selection);
            return sendJson(res, 200, {ok: true, count: rels.length, selected: !!body.selected});
        }

        if(pathname === '/api/selection/clear' && req.method === 'POST'){
            saveSelection({});
            return sendJson(res, 200, {ok: true});
        }

        if(pathname === '/api/stats'){
            let selection = loadSelection();
            let {entries} = scan();
            let selected = Object.keys(selection).filter(k => selection[k]).length;
            let selectedAudio = entries.filter(e => selection[e.relPath] && e.type === 'audio').length;
            return sendJson(res, 200, {
                totalAssets: entries.length,
                selected,
                selectedAudio,
                packs: scan().packs.length
            });
        }

        if(pathname === '/api/apply' && req.method === 'POST'){
            let selection = loadSelection();
            let {entries} = scan();
            let result = applySelection(selection, entries);
            return sendJson(res, 200, {ok: true, ...result});
        }

        if(pathname === '/api/cleanup' && req.method === 'POST'){
            let result = cleanupApplied();
            return sendJson(res, 200, {ok: true, ...result});
        }

        return sendJson(res, 404, {error: 'not found'});
    } catch (e) {
        return sendJson(res, 500, {error: e.message});
    }
});

const PORT = process.env.PORT || 8123;
server.listen(PORT, () => {
    console.log(`Asset Browser running at http://localhost:${PORT}`);
    console.log(`Scan root: ${ROOT}`);
});
