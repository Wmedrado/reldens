/**
 *
 * Reldens - Index
 *
 */

if(window.trustedTypes?.createPolicy){
    trustedTypes.createPolicy('default', {
        createHTML: s => s,
        createScriptURL: s => s
    });
}

// to set logger level and trace, this needs to be specified before the game manager is required:
const urlParams = new URLSearchParams(window.location.search);
window.RELDENS_LOG_LEVEL = (urlParams.get('logLevel') || 7);
window.RELDENS_ENABLE_TRACE_FOR = Number(urlParams.get('traceFor') || 'emergency,alert,critical');
// debug events (warning! this will output in the console ALL the event listeners and every event fired):
// reldens.events.debug = 'all';

const { GameManager } = require('reldens/client');
const { ClientPlugin } = require('../plugins/client-plugin');

let reldens = new GameManager();
// @NOTE: you can specify your game server and your app server URLs in case you serve the client static files from
// a different location.
// reldens.gameServerUrl = 'wss://localhost:8000';
// reldens.appServerUrl = 'https://localhost:8000';
reldens.setupCustomClientPlugin('customPluginKey', ClientPlugin);
window.addEventListener('DOMContentLoaded', () => {
    setupAuthTabs();
    reldens.clientStart();
    setupEditorOverlay();
});

function setupAuthTabs()
{
    let tabs = document.querySelectorAll('[data-auth-tab]');
    if(0 === tabs.length){
        return;
    }
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            let panelKey = tab.getAttribute('data-auth-tab');
            tabs.forEach((t) => {
                let active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            document.querySelectorAll('[data-auth-panel]').forEach((panel) => {
                panel.classList.toggle('active', panelKey === panel.getAttribute('data-auth-panel'));
            });
        });
    });
}

function setupEditorOverlay()
{
    let openButton = document.getElementById('open-editor');
    let overlay = document.getElementById('editor-overlay');
    let closeButton = document.getElementById('close-editor');
    let frame = document.getElementById('editor-frame');
    if(!openButton || !overlay || !closeButton){
        return;
    }
    openButton.addEventListener('click', () => {
        overlay.classList.remove('hidden');
        frame.src = '/editor';
        document.body.classList.add('editor-open');
    });
    let close = () => {
        overlay.classList.add('hidden');
        document.body.classList.remove('editor-open');
    };
    closeButton.addEventListener('click', close);
    window.addEventListener('message', (event) => {
        if(event.data && 'reldens-editor-close' === event.data.type){
            close();
        }
    });
    window.addEventListener('keydown', (event) => {
        if('Escape' === event.key){
            close();
        }
    });
}

// client event listener example with version display:
reldens.events.on('reldens.afterInitEngineAndStartGame', () => {
    reldens.gameDom.getElement('#current-version').innerHTML = reldens.config.client.gameEngine.version+' -';
});

// demo message removal:
reldens.events.on('reldens.startGameAfter', () => {
    reldens.gameDom.getElement('.row-disclaimer')?.remove();
});

reldens.events.on('reldens.activateRoom', (room) => {
    room.onMessage('*', (message) => {
        // @TODO - BETA - Replace 'rski.Bc' by the constant ACTION_SKILL_BEFORE_CAST, standardize events names.
        // filter skills before the cast message:
        if('rski.Bc' !== message.act){
            return;
        }
        // skills cold down animation sample:
        let skillKey = (message.data?.skillKey || '').toString();
        let skillDelay = Number(message.data?.extraData?.sd || 0);
        if('' !== skillKey && 0 < skillDelay){
            let skillElement = reldens.gameDom.getElement('.skill-icon-'+skillKey);
            if(!skillElement){
                return;
            }

            let startTime = Date.now();
            let endTime = startTime + skillDelay;

            function updateCooldown() {
                let currentTime = Date.now();
                let remainingTime = endTime - currentTime;
                if(0 >= remainingTime){
                    skillElement.style.setProperty('--angle', '360deg');
                    skillElement.classList.remove('cooldown');
                    return;
                    // stop the animation when time is up.
                }
                let progress = (skillDelay - remainingTime) / skillDelay;
                let angle = progress * 360;
                skillElement.style.setProperty('--angle', `${angle}deg`);
                requestAnimationFrame(updateCooldown);
            }

            skillElement.classList.add('cooldown');
            skillElement.style.setProperty('--angle', '0deg');
            updateCooldown();
        }
    });
});

// global access is not actually required, the app can be fully encapsulated:
window.reldens = reldens;
