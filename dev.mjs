/**
 * Vibecraft Dev Runner - single-window TUI.
 *
 * Runs, inside ONE terminal window, everything the game needs during dev:
 *   1. Game server      (fs.watch auto-restart)   -> http://localhost:8080
 *   2. Asset browser    (tools/asset-browser/server.mjs)   -> :4300
 *   3. Capital builder  (tools/capital-builder/server.js)  -> :4310
 *
 * The window is a small terminal UI: a header with live status dots, a log
 * pane with real-time prefixed lines (timestamps + per-process colors) and a
 * footer with keybindings. Every log line is ALSO appended to dev-runner.log
 * so bugs can be captured after the window is closed.
 *
 * Single-instance: only ONE of these windows may exist. Running it again
 * while one is active pokes a reload marker (dev-reload.marker) that the
 * active runner watches, so the running instance restarts the game server
 * instead of opening a second CLI. Closing the window (or Ctrl+C / Ctrl+Break)
 * kills every child process tree, so orphan servers never accumulate.
 *
 * Non-TTY fallback: when there is no terminal (CI, agent, piped output) the
 * same processes run but logs go straight to stdout, prefixed by tag.
 *
 * Usage:
 *   node dev.mjs          (or double-click start-game.bat)
 *   Q                     quit (or Ctrl+C)
 *   R                     restart game server
 *   C                     clear log pane
 */

import { spawn, spawnSync, execSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import fs, { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAME_PORT = Number(process.env.RELDENS_APP_PORT || 8080);
const ASSET_PORT = 4300;
const CAPITAL_PORT = 4310;
const HOST = '127.0.0.1';
const LOCK_FILE = path.join(__dirname, 'dev-runner.pid');
const RELOAD_MARKER = path.join(__dirname, 'dev-reload.marker');
const LOG_FILE = path.join(__dirname, 'dev-runner.log');
const LOG_MAX_LINES = 2000;
const OPEN_BROWSER = process.env.RELDENS_DEV_NO_BROWSER !== '1';

const IS_TTY = Boolean(process.stdout.isTTY && process.stdin.isTTY);

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------
const C = {
    reset:   '\x1b[0m',
    bold:    '\x1b[1m',
    dim:     '\x1b[2m',
    red:     '\x1b[31m',
    green:   '\x1b[32m',
    yellow:  '\x1b[33m',
    magenta: '\x1b[35m',
    cyan:    '\x1b[36m',
    white:   '\x1b[37m'
};
const esc = (s) => `\x1b[${s}`;
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
const truncate = (s, w) => {
    const t = stripAnsi(s);
    return t.length > w ? t.slice(0, Math.max(0, w - 1)) + '…' : t;
};

// ---------------------------------------------------------------------------
// Log: ring buffer (TUI) + persistent file (capture every bug)
// ---------------------------------------------------------------------------
let logFd = null;
try { logFd = fs.openSync(LOG_FILE, 'a'); } catch { /* ignore */ }
try {
    if(logFd){
        fs.writeSync(logFd, `\n===== VIBECRAFT DEV RUNNER - ${new Date().toISOString()} =====\n`);
    }
} catch { /* ignore */ }

const lines = [];
let renderTimer = null;
let renderPending = false;

function now(){
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

function appendLogLine(line){
    try { if(logFd) fs.writeSync(logFd, line + '\n'); } catch { /* ignore */ }
}

function scheduleRender(){
    if(renderPending) return;
    renderPending = true;
    renderTimer = setTimeout(() => {
        renderPending = false;
        render();
    }, 80);
}

function pushLine(tag, color, text){
    const t = now();
    lines.push({t, tag, color, text: stripAnsi(String(text))});
    if(lines.length > LOG_MAX_LINES) lines.shift();
    appendLogLine(`[${t}] [${tag}] ${stripAnsi(String(text))}`);
    if(IS_TTY) scheduleRender();
    else process.stdout.write(`${color}[${tag}]\x1b[0m ${text}\n`);
}

// ---------------------------------------------------------------------------
// Terminal UI
// ---------------------------------------------------------------------------
const childAlive = { game: false, assets: false, capital: false };

function render(){
    if(!IS_TTY) return;
    const w = Math.max(60, process.stdout.columns || 100);
    const h = Math.max(8, process.stdout.rows || 24);
    const paneH = Math.max(1, h - 4); // header + divider + footer divider + keys row
    const visible = lines.slice(-paneH);

    const dots = (key) => childAlive[key] ? `${C.green}●${C.reset}` : `${C.red}○${C.reset}`;
    let out = esc('2J') + esc('H');

    // header
    out += `${C.white}${C.bold} ◈ VIBECRAFT DEV RUNNER ${C.reset}`;
    out += `${C.dim} game ${dots('game')}  assets ${dots('assets')}  capital ${dots('capital')}`;
    out += `${C.reset} ${C.dim} ${childAlive.game ? `http://localhost:${GAME_PORT}` : 'game down'}${C.reset}\r\n`;
    out += `${C.dim}${'─'.repeat(Math.min(w, 240))}${C.reset}\r\n`;

    // log pane
    for(const l of visible){
        let color = /error|exception|fatal|failed|stack/i.test(l.text) ? C.red : l.color;
        out += `${C.dim}${l.t}${C.reset} ${color}[${l.tag}]${C.reset} ${C.white}${truncate(l.text, w - 18)}${C.reset}\r\n`;
    }
    for(let i = visible.length; i < paneH; i++) out += '\r\n';

    // footer
    out += `${C.dim}${'─'.repeat(Math.min(w, 240))}${C.reset}\r\n`;
    out += `${C.cyan} [Q] quit${C.reset}  ${C.cyan}[R] restart game${C.reset}  ${C.cyan}[C] clear${C.reset}`;
    out += `${C.dim}   logs → dev-runner.log${C.reset}`;

    process.stdout.write(out);
}

process.stdout.on('resize', () => scheduleRender());

// ---------------------------------------------------------------------------
// Single-instance guard + reload marker
// ---------------------------------------------------------------------------
function isProcessAlive(pid){
    if(!pid) return false;
    try { process.kill(pid, 0); return true; } catch (err) { return err.code === 'EPERM'; }
}

async function pokeRunningRunner(){
    const pid = Number((fs.existsSync(LOCK_FILE) ? fs.readFileSync(LOCK_FILE, 'utf8') : '').trim());
    if(pid && isProcessAlive(pid)){
        console.log('[dev] runner já está ativo (PID ' + pid + ') - acionando reload...');
        try { fs.writeFileSync(RELOAD_MARKER, new Date().toISOString() + '\n'); } catch { /* ignore */ }
        process.exit(0);
    }
    return false;
}

// ---------------------------------------------------------------------------
// Process management
// ---------------------------------------------------------------------------
function isPortOpen(port){
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => resolve(err.code === 'EADDRINUSE'));
        server.listen(port, HOST, () => { server.close(() => resolve(false)); });
    });
}

function killTree(pid){
    if(!pid) return;
    if(process.platform === 'win32'){
        try { spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* ignore */ }
    } else {
        try { process.kill(pid, 'SIGTERM'); } catch { /* ignore */ }
    }
}

/**
 * Self-heals stale orphans: if the ports are busy but NO live runner owns them
 * (the pid lock is dead), the listeners are leftovers from a closed window.
 * They are killed so a single clean instance can start - while a LIVE runner
 * (active lock) is never touched (multi-AI rule).
 */
async function killOrphanOwners(){
    if(process.platform !== 'win32') return false;
    const busy = [];
    for(const port of [GAME_PORT, ASSET_PORT, CAPITAL_PORT]){
        if(await isPortOpen(port)) busy.push(port);
    }
    if(0 === busy.length) return false;
    const pid = Number((fs.existsSync(LOCK_FILE) ? fs.readFileSync(LOCK_FILE, 'utf8') : '').trim());
    if(pid && isProcessAlive(pid)) return false; // a live runner owns the ports - do not touch
    let out;
    try { out = execSync('netstat -ano', { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }); }
    catch { return false; }
    const pids = new Set();
    for(const line of out.split('\n')){
        const inBusyPort = busy.some((p) => line.includes(`:${p} `));
        if(inBusyPort && line.includes('LISTENING')){
            const m = line.trim().split(/\s+/).pop();
            if(m && /^\d+$/.test(m) && Number(m) !== process.pid) pids.add(m);
        }
    }
    for(const pidStr of pids){
        try { spawnSync('taskkill', ['/PID', pidStr, '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* ignore */ }
    }
    if(pids.size > 0) console.log(`[dev] encerrados ${pids.size} processo(s) órfão(s) nas portas ${busy.join(', ')}`);
    return pids.size > 0;
}

const children = [];
function attach(child, tag, color){
    const read = (stream, isErr) => {
        let buffer = '';
        stream.setEncoding('utf8');
        stream.on('data', (chunk) => {
            buffer += chunk;
            let idx;
            while((idx = buffer.indexOf('\n')) >= 0){
                const line = buffer.slice(0, idx).replace(/\r$/, '');
                buffer = buffer.slice(idx + 1);
                if(line) pushLine(tag, isErr ? C.red : color, line);
            }
        });
        stream.on('end', () => { if(buffer) pushLine(tag, isErr ? C.red : color, buffer); });
    };
    read(child.stdout, false);
    read(child.stderr, true);
    child.on('exit', (code) => {
        childAlive[tag] = false;
        pushLine('dev', C.yellow, `${tag} process exited with code ${code}`);
    });
    child.on('error', (err) => pushLine('dev', C.red, `${tag} SPAWN ERROR: ${err.message}`));
}

function start(tag, color, cmd, args, cwd){
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    children.push(child);
    childAlive[tag] = true;
    attach(child, tag, color);
    return child;
}

// ---------------------------------------------------------------------------
// Game server with hot reload
// ---------------------------------------------------------------------------
let gameProc = null;
let restartTimer = null;
let spawnCooldownUntil = 0; // absorbs the kill+respawn churn window
const restartTimes = [];    // recent restart timestamps (crash-loop breaker)

function spawnGame(){
    spawnCooldownUntil = Date.now() + 1500;
    gameProc = start('game', C.cyan, process.execPath, ['index.js'], __dirname);
    gameProc.on('exit', () => { gameProc = null; });
}

function killGame(){
    if(gameProc && gameProc.pid) killTree(gameProc.pid);
    gameProc = null;
}

function restartGame(){
    clearTimeout(restartTimer);
    pushLine('dev', C.yellow, 'restarting game server...');
    killGame();
    restartTimer = setTimeout(() => { if(!gameProc) spawnGame(); }, 300);
}

function startGameWithWatch(){
    spawnGame();
    const watchers = [];
    const WATCH_DIRS = ['lib', 'bin', 'theme/plugins'];
    const WATCH_FILES = ['index.js', 'server.js', 'client.js', 'dev-reload.marker'];
    const WATCHABLE_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.scss', '.css']);
    const IGNORED_BASE = new Set(['config.js', 'dev-reload.marker', 'dev-runner.pid', 'dev-runner.log', 'dev-test.out']);
    // Windows fs.watch fires on reads and attribute touches, and the game writes
    // transient files (config.js, logs) while booting. Only restart on genuine
    // source changes: filter by extension/name so boot churn never loops the runner.
    const shouldIgnore = (filename) => {
        if(!filename) return true;
        const base = path.basename(String(filename));
        if(IGNORED_BASE.has(base)) return true;
        if(base.startsWith('.')) return true;
        const ext = path.extname(base).toLowerCase();
        return !WATCHABLE_EXT.has(ext);
    };
    const scheduleRestart = () => {
        clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
            if(Date.now() < spawnCooldownUntil) return; // absorbing kill+respawn churn
            const now = Date.now();
            restartTimes.push(now);
            const recent = restartTimes.filter((t) => now - t < 30000);
            if(recent.length > 3){
                pushLine('dev', C.red, 'auto-restart desabilitado (muitos reinícios em 30s) - pressione R para reiniciar manualmente');
                return;
            }
            pushLine('dev', C.yellow, 'code change detected - restarting game server...');
            killGame();
            setTimeout(() => { if(!gameProc) spawnGame(); }, 300);
        }, 500);
    };
    let diagCount = 0;
    // Recursive dir watcher: filter transient/generated files (config.js, logs,
    // pid, dist) so boot churn or crash artifacts never loop the runner. Events
    // without a filename are directory-level noise on Windows -> ignored.
    const onChangeTree = (eventType, filename) => {
        if(shouldIgnore(filename)){
            if(diagCount < 20){ diagCount++; appendLogLine(`[dev] WATCH ignore: ${filename || '(dir)'} (${eventType})`); }
            return;
        }
        scheduleRestart();
    };
    // Direct file watcher (index.js, server.js, client.js, reload marker):
    // always a deliberate signal, never filtered.
    const onChangeDirect = () => scheduleRestart();
    for(const dir of WATCH_DIRS){
        const full = path.join(__dirname, dir);
        if(!existsSync(full)) continue;
        try { watchers.push(fs.watch(full, { recursive: true }, onChangeTree)); }
        catch(err){ pushLine('dev', C.yellow, `could not watch ${dir}: ${err.message}`); }
    }
    // Touch the reload marker so its watcher attaches even though the file is
    // ephemeral - re-running start-game.bat writes it and the runner restarts
    // the game in response (single-instance reload path).
    try { fs.writeFileSync(RELOAD_MARKER, ''); } catch { /* ignore */ }
    for(const file of WATCH_FILES){
        const full = path.join(__dirname, file);
        if(!existsSync(full)) continue;
        try { watchers.push(fs.watch(full, onChangeDirect)); } catch { /* ignore */ }
    }
    process.on('exit', () => { for(const w of watchers) try { w.close(); } catch { /* ignore */ } });
}

// ---------------------------------------------------------------------------
// Lifecycle: quit kills every child tree (no more orphans)
// ---------------------------------------------------------------------------
let cleaning = false;
function cleanup(){
    if(cleaning) return;
    cleaning = true;
    try { appendLogLine(`[dev] stopping - ${new Date().toISOString()}`); } catch { /* ignore */ }
    if(IS_TTY){
        try { process.stdin.setRawMode(false); } catch { /* ignore */ }
        process.stdout.write(esc('?1049l') + esc('?25h') + C.reset + '\r\n');
    }
    for(const c of children){ if(c.pid) killTree(c.pid); }
    try { if(logFd) fs.closeSync(logFd); } catch { /* ignore */ }
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGBREAK', cleanup);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(){
    if(await pokeRunningRunner()) return;

    // Self-heal: clear stale orphans left by closed windows before starting.
    if(await killOrphanOwners()){
        await new Promise((resolve) => setTimeout(resolve, 1200)); // let the ports release
    }

    const gameBusy = await isPortOpen(GAME_PORT);
    const assetsBusy = await isPortOpen(ASSET_PORT);
    const capitalBusy = await isPortOpen(CAPITAL_PORT);

    try { fs.writeFileSync(LOCK_FILE, String(process.pid)); } catch { /* ignore */ }
    process.on('exit', () => {
        try { fs.rmSync(LOCK_FILE, { force: true }); } catch { /* ignore */ }
        try { fs.rmSync(RELOAD_MARKER, { force: true }); } catch { /* ignore */ }
    });

    if(gameBusy || assetsBusy || capitalBusy){
        console.error('\x1b[31mERROR: uma instância já está rodando nestas portas.\x1b[0m');
        console.error('Este runner NÃO inicia duplicados (regra multi-IA).');
        console.error('Se você quer RECARREGAR, rode de novo: o runner ativo será atualizado.');
        console.error('Se houver órfãos (sem janela), mate-os e rode de novo:');
        console.error('  Get-NetTCPConnection -LocalPort 8080,4300,4310 | select OwningProcess');
        console.error('  taskkill /PID <pid> /T /F');
        process.exit(1);
    }

    if(IS_TTY){
        process.stdout.write(esc('?1049h') + esc('?25l') + esc('2J') + esc('H'));
        try {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', (chunk) => {
                for(const ch of chunk){
                    if(ch === '\x03' || ch === 'q' || ch === 'Q'){ cleanup(); return; }
                    if(ch === 'r' || ch === 'R'){ restartGame(); }
                    if(ch === 'c' || ch === 'C'){ lines.length = 0; scheduleRender(); }
                }
            });
            process.stdin.on('end', cleanup);
            process.stdin.on('close', cleanup);
        } catch (err) {
            // stdin raw mode unavailable - keyboard shortcuts disabled, window still works
        }
        pushLine('dev', C.yellow, 'dev runner iniciado. Q=quit R=restart C=clear. logs → dev-runner.log');
    } else {
        pushLine('dev', C.yellow, 'dev runner (plain mode - no TTY). logs → dev-runner.log');
    }

    start('assets', C.magenta, process.execPath, [path.join(__dirname, 'tools/asset-browser/server.mjs')], __dirname);
    start('capital', C.green, process.execPath, [path.join(__dirname, 'tools/capital-builder/server.js')], __dirname);
    // Game server with auto-restart on code change.
    // NOTE: node --watch is incompatible with Parcel workers (IPC breaks),
    // so we use our own fs.watch watcher that kills + respawns the server.
    startGameWithWatch();

    // Auto-open the browser once the game is listening (only on a fresh start).
    if(!gameBusy && OPEN_BROWSER){
        const attempts = Date.now() + 25000;
        const poll = async () => {
            if(await isPortOpen(GAME_PORT)){
                try { spawn('cmd', ['/c', 'start', '', `http://localhost:${GAME_PORT}`], { windowsHide: true, stdio: 'ignore' }).unref(); } catch { /* ignore */ }
                return;
            }
            if(Date.now() < attempts && !cleaning) setTimeout(poll, 500);
        };
        setTimeout(poll, 1500);
    }
}

main();
