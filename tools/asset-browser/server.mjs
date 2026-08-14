import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_ROOT = path.resolve(__dirname, '../../assets-cc0');
const SELECTION_FILE = path.join(ASSETS_ROOT, 'selection.json');
const PORT = process.env.ASSET_BROWSER_PORT || 4300;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);
const AUDIO_EXT = new Set(['.mp3', '.ogg', '.wav', '.flac']);
const SKIP_DIRS = new Set(['_staging', '.git']);

function walk(dir, rel = '') {
    const entries = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        const relPath = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            entries.push({ type: 'dir', path: relPath, name: entry.name, children: walk(full, relPath) });
        } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (IMAGE_EXT.has(ext) || AUDIO_EXT.has(ext) || ext === '.json' || ext === '.txt' || ext === '.md') {
                entries.push({
                    type: IMAGE_EXT.has(ext) ? 'image' : AUDIO_EXT.has(ext) ? 'audio' : 'text',
                    path: relPath,
                    name: entry.name,
                    size: fs.statSync(full).size
                });
            }
        }
    }
    return entries;
}

app.get('/api/tree', (_req, res) => {
    res.json({ root: 'assets-cc0', tree: walk(ASSETS_ROOT) });
});

app.get('/api/image', async (req, res) => {
    const rel = req.query.p;
    if (!rel || rel.includes('..')) return res.status(400).send('bad path');
    const full = path.join(ASSETS_ROOT, rel);
    if (!fs.existsSync(full)) return res.status(404).send('not found');
    const ext = path.extname(full).toLowerCase();
    if (!IMAGE_EXT.has(ext)) return res.status(400).send('not image');
    if (ext === '.gif') return res.sendFile(full);
    try {
        const meta = await sharp(full).metadata();
        res.json({ path: rel, width: meta.width, height: meta.height, format: meta.format });
    } catch (err) {
        res.status(500).send(String(err.message || err));
    }
});

app.get('/api/file', (req, res) => {
    const rel = req.query.p;
    if (!rel || rel.includes('..')) return res.status(400).send('bad path');
    const full = path.join(ASSETS_ROOT, rel);
    if (!fs.existsSync(full)) return res.status(404).send('not found');
    res.sendFile(full);
});

function loadSelection() {
    try {
        return JSON.parse(fs.readFileSync(SELECTION_FILE, 'utf8'));
    } catch {
        return { version: 1, frames: {}, files: {} };
    }
}

app.get('/api/selection', (_req, res) => res.json(loadSelection()));

app.put('/api/selection', (req, res) => {
    const sel = req.body;
    if (!sel || typeof sel !== 'object') return res.status(400).send('bad body');
    sel.version = 1;
    fs.writeFileSync(SELECTION_FILE, JSON.stringify(sel, null, 2));
    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log(`[asset-browser] http://localhost:${PORT}  (assets: ${ASSETS_ROOT})`);
});
