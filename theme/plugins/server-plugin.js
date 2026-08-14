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
const { FarmObject } = require('reldens/lib/farming/server/farm-object');
const { QuestPlugin } = require('reldens/lib/quests/server/plugin');
const { EnergyPlugin } = require('reldens/lib/energy/server/plugin');
const { StatusEffectsPlugin } = require('reldens/lib/status-effects/server/plugin');
const { ChestObject } = require('reldens/lib/chests/server/chest-object');
const { GatheringObject } = require('reldens/lib/gathering/server/gathering-object');
const { BankObject } = require('reldens/lib/bank/server/bank-object');
const { AchievementBoardObject } = require('reldens/lib/achievements/server/achievement-board-object');
const { AchievementPlugin } = require('reldens/lib/achievements/server/plugin');
const { ServerEventsPlugin } = require('reldens/lib/events/server/plugin');
const { EnchantObject } = require('reldens/lib/enchant/server/enchant-object');
const { PetObject } = require('reldens/lib/pets/server/pet-object');
const { PetPlugin } = require('reldens/lib/pets/server/plugin');
const { DailyTaskBoardObject } = require('reldens/lib/daily-tasks/server/daily-task-board-object');
const { DailyTasksPlugin } = require('reldens/lib/daily-tasks/server/plugin');
const { VIPPlugin } = require('reldens/lib/vip/server/plugin');
const { LandPlugin } = require('reldens/lib/land/server/plugin');
const { ProfessionsPlugin } = require('reldens/lib/professions/server/plugin');
const { EditorPlugin } = require('reldens/lib/editor/server/plugin');
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
            let statusEffectsPlugin = new StatusEffectsPlugin({events: this.events});
            statusEffectsPlugin.setup();
            let landPlugin = new LandPlugin({
                events: this.events,
                dataServer: event.serverManager.dataServer
            });
            landPlugin.setup();
            let achievementPlugin = new AchievementPlugin({
                events: this.events,
                dataServer: event.serverManager.dataServer
            });
            await achievementPlugin.setup();
            let serverEventsPlugin = new ServerEventsPlugin({
                events: this.events,
                config: event.serverManager.configManager
            });
            serverEventsPlugin.setup();
            let petPlugin = new PetPlugin({
                events: this.events,
                dataServer: event.serverManager.dataServer
            });
            petPlugin.setup();
            let professionsPlugin = new ProfessionsPlugin({
                events: this.events,
                dataServer: event.serverManager.dataServer,
                config: event.serverManager.configManager
            });
            professionsPlugin.setup();
            let dailyTasksPlugin = new DailyTasksPlugin({
                events: this.events,
                dataServer: event.serverManager.dataServer
            });
            await dailyTasksPlugin.setup();
            let vipPlugin = new VIPPlugin({
                events: this.events,
                config: event.serverManager.configManager
            });
            vipPlugin.setup();
            let editorPlugin = new EditorPlugin({events: this.events});
            editorPlugin.attachRoutes(event);
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
        customClasses.objects['craft_station_1'] = CraftingObject;
        customClasses.objects['quest_board_1'] = QuestGiverObject;
        customClasses.objects['farm_plot_1'] = FarmObject;
        customClasses.objects['chest_1'] = ChestObject;
        customClasses.objects['tree_1'] = GatheringObject;
        customClasses.objects['banker_1'] = BankObject;
        customClasses.objects['enchanter_1'] = EnchantObject;
        customClasses.objects['petdealer_1'] = PetObject;
        customClasses.objects['achievement_board_1'] = AchievementBoardObject;
        customClasses.objects['dailytask_board_1'] = DailyTaskBoardObject;
        // capital (room 11) - unique object_class_key per objects.object_class_key UNIQUE constraint:
        customClasses.objects['capital_ferreiro'] = WeaponsMaster;
        customClasses.objects['capital_quests'] = QuestNpc;
        customClasses.objects['capital_healer'] = Healer;
        customClasses.objects['capital_banker'] = BankObject;
        customClasses.objects['capital_chest'] = ChestObject;
        customClasses.objects['capital_farm_1'] = FarmObject;
        customClasses.objects['capital_farm_2'] = FarmObject;
        customClasses.objects['capital_craft'] = CraftingObject;
        customClasses.objects['capital_board'] = QuestGiverObject;
        customClasses.objects['capital_tree_1'] = GatheringObject;
        customClasses.objects['capital_tree_2'] = GatheringObject;
        customClasses.objects['capital_tree_3'] = GatheringObject;
    }

}

module.exports.ServerPlugin = ServerPlugin;
