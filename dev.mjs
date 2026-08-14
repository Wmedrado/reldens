/**
 * Vibecraft Dev Runner — single-window development CLI.
 *
 * Runs, inside THIS terminal window, everything the game needs during dev:
 *   1. Game server      (node --watch index.js)   -> auto-restart on code change
 *   2. Asset browser    (node tools/asset-browser/server.mjs)
 *   3. (auto) opens http://localhost:8080 in the default browser
 *
 * All logs are unified in this one window, prefixed by process.
 *
 * Safety (multi-AI rule): before starting, dev.js checks that the game
 * ports are FREE. If another instance is already running, it REFUSES to
 * start instead of spawning a duplicate server. If you see a warning here,
 * kill the other instance (taskkill /PID <pid> /T /F) and run again.
 *
 * Usage:
 *   node dev.js          (or double-click start-game.bat)
 *   Ctrl+C               stops everything.
 */

import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import fs, { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAME_PORT = Number(process.env.RELDENS_APP_PORT || 8080);
const ASSET_PORT = 4300;
const HOST = '127.0.0.1';

function isPortOpen(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => resolve(err.code === 'EADDRINUSE'));
        server.listen(port, HOST, () => {
            server.close(() => resolve(false));
        });
    });
}

function attach(child, tag, color) {
    const pad = (line) => `${color}[${tag}]\x1b[0m ${line}`;
    const read = (stream, writer) => {
        let buffer = '';
        stream.setEncoding('utf8');
        stream.on('data', (chunk) => {
            buffer += chunk;
            let idx;
            while ((idx = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, idx).replace(/\r$/, '');
                writer(pad(line));
                buffer = buffer.slice(idx + 1);
            }
        });
        stream.on('end', () => { if (buffer) writer(pad(buffer)); });
    };
    read(child.stdout, (l) => process.stdout.write(l + '\n'));
    read(child.stderr, (l) => process.stderr.write(l + '\n'));
    child.on('exit', (code) => {
        process.stdout.write(`${pad(`process exited with code ${code}`)}\n`);
    });
}

const children = [];
function start(tag, color, cmd, args, cwd) {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    children.push(child);
    attach(child, tag, color);
    child.on('error', (err) => {
        process.stdout.write(`${color}[${tag}]\x1b[0m SPAWN ERROR: ${err.message}\n`);
    });
    return child;
}

function cleanup() {
    process.stdout.write('\n\x1b[33mStopping all dev processes...\x1b[0m\n');
    for (const c of children) {
        try { if (process.platform === 'win32') { spawn('taskkill', ['/pid', String(c.pid), '/T', '/F']); } else { c.kill('SIGTERM'); } } catch { /* ignore */ }
    }
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

const CYAN = '\x1b[36m', GREEN = '\x1b[32m', MAGENTA = '\x1b[35m';

const WATCH_DIRS = ['lib', 'bin', 'theme/default/plugins'];
const WATCH_FILES = ['index.js', 'server.js', 'client.js'];

let gameProc = null;
let restartTimer = null;
let starting = false;

function spawnGame() {
    starting = true;
    gameProc = spawn(process.execPath, ['index.js'], { cwd: __dirname, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    children.push(gameProc);
    attach(gameProc, 'game', CYAN);
    gameProc.on('error', (err) => {
        process.stdout.write(`${CYAN}[game]\x1b[0m SPAWN ERROR: ${err.message}\n`);
    });
    gameProc.on('exit', () => {
        starting = false;
        gameProc = null;
    });
}

function killGame() {
    if (gameProc && gameProc.pid) {
        try {
            if (process.platform === 'win32') spawn('taskkill', ['/pid', String(gameProc.pid), '/T', '/F']);
            else gameProc.kill('SIGTERM');
        } catch { /* ignore */ }
        gameProc = null;
    }
}

function scheduleRestart() {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
        if (starting) return; // wait until current boot finishes before restarting
        process.stdout.write('\n\x1b[33m[dev] code change detected - restarting game server...\x1b[0m\n');
        killGame();
        setTimeout(() => {
            if (!gameProc) spawnGame();
        }, 300);
    }, 400);
}

function startGameWithWatch() {
    spawnGame();
    const watchers = [];
    for (const dir of WATCH_DIRS) {
        if (!existsSync(path.join(__dirname, dir))) continue;
        try {
            watchers.push(fs.watch(path.join(__dirname, dir), { recursive: true }, scheduleRestart));
        } catch (err) {
            process.stdout.write(`${CYAN}[dev]\x1b[0m could not watch ${dir}: ${err.message}\n`);
        }
    }
    for (const file of WATCH_FILES) {
        const full = path.join(__dirname, file);
        if (!existsSync(full)) continue;
        try {
            watchers.push(fs.watch(full, scheduleRestart));
        } catch { /* ignore */ }
    }
    process.on('exit', () => { for (const w of watchers) try { w.close(); } catch { /* ignore */ } });
}

async function main() {    const gameBusy = await isPortOpen(GAME_PORT);
    const assetsBusy = await isPortOpen(ASSET_PORT);

    console.log('=============================================');
    console.log('  Vibecraft Dev Runner');
    console.log(`  Game   : http://localhost:${GAME_PORT}  ${gameBusy ? '⚠ JÁ EM USO' : ''}`);
    console.log(`  Assets : http://localhost:${ASSET_PORT}  ${assetsBusy ? '⚠ JÁ EM USO' : ''}`);
    console.log('  Ctrl+C to stop everything.');
    console.log('=============================================');
    console.log('');

    if (gameBusy || assetsBusy) {
        console.error('\x1b[31mERROR: uma instância já está rodando nestas portas.\x1b[0m');
        console.error('Este runner NÃO inicia duplicados (regra multi-IA).');
        console.error('Encontre e mate o processo existente:');
        console.error('  Get-NetTCPConnection -LocalPort 8080,4300 | select OwningProcess');
        console.error('  taskkill /PID <pid> /T /F');
        process.exit(1);
    }

    start('assets', MAGENTA, process.execPath, [path.join(__dirname, 'tools/asset-browser/server.mjs')], __dirname);
    // Game server with auto-restart on code change.
    // NOTE: node --watch is incompatible with Parcel workers (IPC breaks),
    // so we use our own fs.watch watcher that kills + respawns the server.
    startGameWithWatch();

    console.log('');
    setTimeout(() => {
        if (!gameBusy) {
            spawn('cmd', ['/c', 'start', '', `http://localhost:${GAME_PORT}`], { windowsHide: true, stdio: 'ignore' }).unref();
        }
    }, 6000);
}

main();
