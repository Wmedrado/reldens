/**
 *
 * Reldens - Theme - Server Plugin
 *
 */

const { Healer } = require('./objects/server/healer');
const { QuestNpc } = require('./objects/server/quest-npc');
const { WeaponsMaster } = require('./objects/server/weapons-master');
const { CraftingObject } = require('reldens/lib/crafting/server/crafting-object');
const { QuestGiverObject } = require('reldens/lib/quests/server/quest-giver-object');
const { QuestPlugin } = require('reldens/lib/quests/server/plugin');
const { EnergyPlugin } = require('reldens/lib/energy/server/plugin');
const { PluginInterface } = require('reldens/lib/features/plugin-interface');

class ServerPlugin extends PluginInterface
{

    setup(props)
    {
        this.events = props.events;
        this.events.on('reldens.beforeInitializeManagers', (props) => {
            this.defineCustomClasses(props);
        });
        this.events.on('reldens.serverBeforeListen', async (event) => {
            let questPlugin = new QuestPlugin({
                events: this.events,
                dataServer: event.serverManager.dataServer
            });
            await questPlugin.setup();
            let energyPlugin = new EnergyPlugin({
                events: this.events,
                dataServer: event.serverManager.dataServer
            });
            energyPlugin.setup();
        });
    }

    defineCustomClasses(props)
    {
        let customClasses = props.serverManager.configManager.configList.server.customClasses;
        if(!customClasses['objects']){
            customClasses.objects = {};
        }
        if(!customClasses['roomsClass']){
            customClasses.roomsClass = {};
        }
        // @TODO - BETA - Clean up all the custom classes, by default these can be all default objects with all the
        //   data coming from the storage. Leave just a custom class as sample like the "Npc1" on the client-plugin.
        customClasses.objects['npc_2'] = Healer;
        customClasses.objects['npc_4'] = WeaponsMaster;
        customClasses.objects['npc_5'] = QuestNpc;
        customClasses.objects['crafting'] = CraftingObject;
        customClasses.objects['quest'] = QuestGiverObject;
    }

}

module.exports.ServerPlugin = ServerPlugin;
