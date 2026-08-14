/**
 *
 * Reldens - Theme - Client Plugin
 *
 */

const { PluginInterface } = require('reldens/lib/features/plugin-interface');
const { Npc1 } = require('./objects/client/npc1');
const { CraftingClientPlugin } = require('reldens/lib/crafting/client/plugin');
const { QuestsClientPlugin } = require('reldens/lib/quests/client/plugin');

class ClientPlugin extends PluginInterface
{

    setup(props)
    {
        this.events = props.events;
        this.events.on('reldens.beforeJoinGame', (props) => {
            this.defineCustomClasses(props);
        });
        this.events.on('reldens.beforeJoinGame', (props) => {
            new CraftingClientPlugin().setup(props);
            new QuestsClientPlugin().setup(props);
        });
    }

    defineCustomClasses(props)
    {
        // example on how to define a custom class with a plugin:
        let customClasses = props.gameManager.config.client.customClasses;
        if(!customClasses['objects']){
            customClasses.objects = {};
        }
        customClasses.objects['people_town_1'] = Npc1;
    }

}

module.exports.ClientPlugin = ClientPlugin;
