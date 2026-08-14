/**
 *
 * Reldens - Editor Plugin
 *
 * Mounts the in-game editor (asset browser + map editor) on the express app
 * exposed by the server manager. The editor is served from the same origin
 * as the game so the initial screen can open it as an overlay view.
 *
 */

const { PluginInterface } = require('../../features/plugin-interface');
const { EditorRouter } = require('./router');
const { Logger } = require('@reldens/utils');
const { EDITOR_PATH } = require('../constants');

class EditorPlugin extends PluginInterface
{

    /**
     * @param {Object} props
     * @param {Object} [props.events]
     * @param {Object} [props.config]
     */
    constructor(props)
    {
        super();
        this.events = props?.events || false;
        this.config = props?.config || {};
        this.isEnabled = 1 === Number(process.env.RELDENS_ENABLE_EDITOR || 1);
        this.app = false;
    }

    /**
     * @param {Object} props
     * @param {Object} props.events
     * @returns {Promise<boolean>}
     */
    async setup(props)
    {
        if(!this.isEnabled){
            Logger.info('EditorPlugin: disabled (RELDENS_ENABLE_EDITOR=0).');
            return false;
        }
        this.events = props.events || this.events;
        if(!this.events){
            return false;
        }
        this.events.on('reldens.serverBeforeListen', (event) => {
            this.attachRoutes(event);
        });
        return true;
    }

    /**
     * Mount the editor router on the express app.
     *
     * @param {Object} event
     * @returns {boolean}
     */
    attachRoutes(event)
    {
        let serverManager = event?.serverManager || false;
        let app = serverManager?.app || false;
        if(!app){
            Logger.error('EditorPlugin: express app not available on reldens.serverBeforeListen.');
            return false;
        }
        if(this.app){
            return false;
        }
        this.app = app;
        let editorRouter = EditorRouter.create();
        app.use(EDITOR_PATH, editorRouter);
        Logger.info('EditorPlugin: editor mounted at ' + EDITOR_PATH + '.');
        return true;
    }

}

module.exports.EditorPlugin = EditorPlugin;
