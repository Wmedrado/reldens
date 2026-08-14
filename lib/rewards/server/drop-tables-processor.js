/**
 *
 * Reldens - DropTablesProcessor
 *
 * Resolves which items drop from an object's shared drop tables. For each table
 * one random item is picked and its chance is rolled against a 100000 scale, so
 * rare drops can use very granular probabilities (port of the Kaetram drop
 * design as a pattern, not code).
 *
 */

const { Reward } = require('./reward');
const { Logger, sc } = require('@reldens/utils');

class DropTablesProcessor
{

    static DROP_CHANCE_MAX = 100000;

    /**
     * Returns the list of winning rewards coming from the object drop tables.
     * @param {Object} targetObject
     * @param {Object} playerSchema
     * @param {Object} [events]
     * @returns {Promise<Array<Reward>>}
     */
    static async getWinningRewards(targetObject, playerSchema, events)
    {
        let dropTables = sc.get(targetObject, 'dropTables', []);
        if(0 === dropTables.length){
            return [];
        }
        let winning = [];
        for(let table of dropTables){
            let items = sc.get(table, 'items', []);
            if(0 === items.length){
                continue;
            }
            let randomItem = items[sc.randomInteger(0, items.length - 1)];
            if(!(await this.playerCanDrop(randomItem, playerSchema, events))){
                continue;
            }
            if(!this.roll(randomItem)){
                continue;
            }
            winning.push(this.toReward(randomItem));
        }
        return winning;
    }

    /**
     * Rolls the drop chance of an item on a 100000 scale.
     * @param {Object} item
     * @returns {boolean}
     */
    static roll(item)
    {
        return sc.randomInteger(1, this.DROP_CHANCE_MAX) <= Number(sc.get(item, 'chance', 0));
    }

    /**
     * Validates the gating conditions of a drop table item against the player.
     * Plugins can extend the gating (quest/achievement) by emitting the
     * `reldens.dropTablesItemGate` event and setting `canDrop` on the gate.
     * @param {Object} item
     * @param {Object} playerSchema
     * @param {Object} [events]
     * @returns {Promise<boolean>}
     */
    static async playerCanDrop(item, playerSchema, events)
    {
        let minLevel = Number(sc.get(item, 'minPlayerLevel', 0));
        if(0 < minLevel){
            let playerLevel = playerSchema?.skillsServer?.classPath?.currentLevel || 0;
            if(playerLevel < minLevel){
                return false;
            }
        }
        if(!events){
            return true;
        }
        let gate = {item, playerSchema, canDrop: true};
        await events.emit('reldens.dropTablesItemGate', gate);
        return gate.canDrop;
    }

    /**
     * Turns a winning drop table item into a Reward so the existing rewards
     * pipeline delivers it to the player.
     * @param {Object} item
     * @returns {Reward}
     */
    static toReward(item)
    {
        let itemModel = sc.get(item, 'item', null);
        return new Reward({
            id: 'drop_table_'+(itemModel?.id || ''),
            itemId: itemModel?.id || null,
            dropRate: 100,
            dropQuantity: Number(sc.get(item, 'quantity', 1)) || 1,
            hasDropBody: 0,
            item: itemModel
        });
    }

}

module.exports.DropTablesProcessor = DropTablesProcessor;
