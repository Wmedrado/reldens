/**
 *
 * Reldens - Local Run Bootstrap
 *
 * This file runs the server from inside the reldens repository itself.
 * Since there is no `node_modules/reldens` (this IS reldens), we require
 * the local server entry and point `reldensModulePath` back at the project
 * root so ThemeManager finds `lib/`, `theme/` and `migrations/` locally.
 *
 * (multi-AI dev rule) We also patch child_process spawn/fork to force
 * windowsHide=true so every child console (parcel workers, tools) is
 * hidden on Windows — the dev runner stays a SINGLE window.
 *
 */

const childProcess = require('child_process');
const _origSpawn = childProcess.spawn.bind(childProcess);
const _origFork = childProcess.fork.bind(childProcess);

function forceWindowsHide(options) {
    if (options === undefined || options === null) options = {};
    if (options.windowsHide === undefined) options.windowsHide = true;
    return options;
}
childProcess.spawn = function (file, args, options) {
    return _origSpawn(file, args, forceWindowsHide(options));
};
childProcess.fork = function (modulePath, args, options) {
    return _origFork(modulePath, args, forceWindowsHide(options));
};

const { ServerManager } = require('./server');
const { ServerPlugin } = require('./theme/plugins/server-plugin');

let appServer = new ServerManager({
    projectRoot: __dirname,
    projectThemeName: 'default',
    reldensModulePath: __dirname,
    reldensModuleLibPath: __dirname + '/lib',
    reldensModuleThemePath: __dirname + '/theme',
    customPlugin: ServerPlugin
});

// events debug:
// appServer.events.debug = 'all';

appServer.events.on('reldens.serverConfigFeaturesReady', (props) => {
    console.log('LocalRun - serverConfigFeaturesReady OK');
});

// run the server!
console.log('LocalRun - ServerPlugin starting...');
appServer.createServers().then(() => {
    console.log('LocalRun - CREATED APP SERVER INSTANCE!');
    appServer.start().then(() => {
        console.log('LocalRun - SERVER UP AND RUNNING!');
    }).catch((err) => {
        console.log('LocalRun - ServerPlugin error:', err);
        process.exit(1);
    });
});
