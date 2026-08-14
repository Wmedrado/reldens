/**
 *
 * Reldens - Local Run Bootstrap
 *
 * This file runs the server from inside the reldens repository itself.
 * Since there is no `node_modules/reldens` (this IS reldens), we require
 * the local server entry and point `reldensModulePath` back at the project
 * root so ThemeManager finds `lib/`, `theme/` and `migrations/` locally.
 *
 */

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
