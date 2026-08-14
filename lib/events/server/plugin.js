/**
 *
 * Reldens - ServerEventsPlugin
 *
 * Wires the server events manager into the game: loads the config, attaches
 * the public event state to the super initial game data and broadcasts changes.
 *
 */

const { ServerEventsManager } = require('./events-manager');
const { Logger, sc } = require('@reldens/utils');

class ServerEventsPlugin
{

    /**
     * @param {Object} props
     * @param {Object} props.events
     * @param {Object} props.config
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.events = sc.get(props, 'events', false);
        /** @type {Object|boolean} */
        this.config = sc.get(props, 'config', false);
        /** @type {ServerEventsManager} */
        this.manager = new ServerEventsManager({events: this.events, config: this.config});
    }

    /**
     * @returns {boolean}
     */
    setup()
    {
        if(!this.events){
            Logger.error('ServerEventsPlugin: EventsManager undefined.');
            return false;
        }
        if(!this.config){
            Logger.error('ServerEventsPlugin: Config undefined.');
            return false;
        }
        this.manager.loadConfig();
        this.events.on('reldens.beforeSuperInitialGameData', (superInitialGameData) => {
            superInitialGameData.serverEvents = this.manager.publicState();
        });
        return true;
    }

}

module.exports.ServerEventsPlugin = ServerEventsPlugin;
