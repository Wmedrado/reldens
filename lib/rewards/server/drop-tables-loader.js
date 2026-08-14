/**
 *
 * Reldens - DropTablesLoader
 *
 * Loads the shared drop tables assigned to an object and prepares them for the
 * drops processor. Mirrors the Kaetram concept of shared drop tables (port as
 * pattern, not code): an object can inherit items from several tables.
 *
 */

const { Logger, sc } = require('@reldens/utils');

class DropTablesLoader
{

    /**
     * Loads `objects_drop_tables` with their related drop tables and items into
     * `objectInstance.dropTables` as a list of `{key, items}` entries.
     * @param {Object} objectInstance
     * @returns {Promise<void>}
     */
    static async enrichWithDropTables(objectInstance)
    {
        if(!objectInstance){
            return;
        }
        objectInstance.dropTables = [];
        let objectsDropTables = await objectInstance.dataServer.getEntity('objectsDropTables').loadByWithRelations(
            'object_id',
            objectInstance.id,
            ['related_drop_tables.related_drop_tables_items.related_items_item']
        );
        if(!objectsDropTables){
            return;
        }
        for(let objectDropTable of objectsDropTables){
            let dropTable = objectDropTable.related_drop_tables;
            if(!dropTable){
                continue;
            }
            let items = [];
            for(let dropTableItem of sc.get(dropTable, 'related_drop_tables_items', [])){
                let item = dropTableItem.related_items_item;
                if(!item){
                    Logger.error('Drop table item has no related item.', dropTableItem);
                    continue;
                }
                items.push({
                    item,
                    chance: Number(dropTableItem.chance) || 0,
                    quantity: Number(dropTableItem.quantity) || 1,
                    minPlayerLevel: Number(dropTableItem.min_player_level) || 0,
                    requiredQuestKey: dropTableItem.required_quest_key,
                    requiredQuestStatus: dropTableItem.required_quest_status,
                    requiredAchievementKey: dropTableItem.required_achievement_key
                });
            }
            if(0 === items.length){
                continue;
            }
            objectInstance.dropTables.push({key: dropTable.key, items});
        }
    }

}

module.exports.DropTablesLoader = DropTablesLoader;
