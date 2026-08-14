/**
 *
 * Reldens - Detached Server Launcher
 *
 * Spawns the game server (index.js) fully detached from this shell so it
 * keeps running after the command returns. Output goes to server-run.log /
 * server-run.err.log.
 *
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Ensure the self-referencing "reldens" package link exists (npm install wipes it):
const pkgDir = path.join(process.cwd(), 'node_modules', 'reldens');
if(!fs.existsSync(pkgDir)){
    fs.symlinkSync(process.cwd(), pkgDir, 'junction');
    console.log('CREATED junction node_modules/reldens');
}

const logFd = fs.openSync('server-run.log', 'a');
const errFd = fs.openSync('server-run.err.log', 'a');
const child = spawn(process.execPath, ['index.js'], {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', logFd, errFd],
    windowsHide: true
});
child.unref();
console.log('SERVER_PID='+child.pid);
