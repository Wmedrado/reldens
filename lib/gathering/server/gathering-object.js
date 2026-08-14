/**
 *
 * Reldens - GatheringObject
 *
 * World resource node (tree, rock, fishing spot, bush) adapted from the
 * Kaetram resource system: the player interacts with the node, a timed
 * gathering loop ("difficulty") runs on the server, then the node yields an
 * item and experience. A level requirement gates the gather, the node
 * depletes after a configurable number of yields and respawns after a delay.
 *
 * Resource configuration lives on the "gathering_resources" table (one row
 * per world object). Extends the NPC object so it keeps the standard
 * interaction flow (click -> dialog box with options).
 *
 */

const { NpcObject } = require('../../objects/server/object/type/npc-object');
const { GameConst } = require('../../game/constants');
const { TYPE_GATHERING, OPTION_GATHER, SNIPPETS } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../users/server/player').Player} Player
 */
class GatheringObject extends NpcObject
{

    /**
     * @param {Object} props
     */
    constructor(props)
    {
        super(props);
        this.type = TYPE_GATHERING;
        this.eventsPrefix = this.uid+'.gathering';
        this.clientParams.type = TYPE_GATHERING;
        this.content = sc.get(this.clientParams, 'content', SNIPPETS.OBJECT.CONTENT);
        this.options = sc.get(this.clientParams, 'options', {
            [OPTION_GATHER]: {
                label: SNIPPETS.OBJECT.OPTIONS.GATHER,
                value: OPTION_GATHER
            }
        });
        this.resource = false;
        this.yields = 0;
        this.gathering = false;
        this.cooldownUntil = 0;
        this.dataServer = false;
    }

    /**
     * @param {Object} props
     * @returns {Promise<void>}
     */
    async runAdditionalSetup(props)
    {
        this.dataServer = sc.get(props.objectsManager, 'dataServer', false);
        if(false === this.dataServer){
            Logger.error('GatheringObject: Data Server was not specified.');
            return;
        }
        await this.loadResource();
    }

    /**
     * @returns {Promise<void>}
     */
    async loadResource()
    {
        let repository = this.dataServer.getEntity('gatheringResources');
        if(!repository){
            Logger.error('GatheringObject: "gatheringResources" entity not found, run "reldens generateEntities".');
            return;
        }
        let rows = await repository.loadByWithRelations('object_id', this.id, ['related_items_item']);
        if(0 === rows.length){
            Logger.info('GatheringObject "'+this.key+'" has no resource configured.');
            return;
        }
        let row = rows[0];
        this.resource = {
            id: row.id,
            code: row.code,
            label: row.label,
            itemKey: row.related_items_item?.key || false,
            itemLabel: row.related_items_item?.label || row.item_id,
            experience: Number(row.experience || 5),
            difficulty: Number(row.difficulty || 2000),
            levelRequirement: Number(row.level_requirement || 0),
            maxYields: Number(row.max_yields || 3),
            respawnTime: Number(row.respawn_time || 30000),
            minQty: Number(row.min_qty || 1),
            maxQty: Number(row.max_qty || 1)
        };
    }

    /**
     * @param {Object} client
     * @param {Object} data
     * @param {Object} room
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async executeMessageActions(client, data, room, playerSchema)
    {
        let superResult = await super.executeMessageActions(client, data, room, playerSchema);
        if(false === superResult){
            return false;
        }
        if(OPTION_GATHER !== sc.get(data, 'value', 'init')){
            return false;
        }
        return await this.doGather(client, room, playerSchema);
    }

    /**
     * Validate the gather (level, cooldown, availability) and run the timed
     * gathering loop.
     *
     * @param {Object} client
     * @param {Object} room
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async doGather(client, room, playerSchema)
    {
        if(!this.resource || false === this.resource.itemKey){
            client.send('*', {act: GameConst.UI, id: this.id, content: SNIPPETS.OBJECT.NO_RESOURCE});
            return true;
        }
        if(Date.now() < this.cooldownUntil){
            client.send('*', {act: GameConst.UI, id: this.id, content: SNIPPETS.OBJECT.COOLDOWN});
            return true;
        }
        if(this.gathering){
            client.send('*', {act: GameConst.UI, id: this.id, content: SNIPPETS.OBJECT.BUSY});
            return true;
        }
        let playerLevel = Number(playerSchema.skillsServer?.classPath?.currentLevel || 0);
        if(playerLevel < this.resource.levelRequirement){
            client.send('*', {act: GameConst.UI, id: this.id, content: SNIPPETS.OBJECT.LEVEL_TOO_LOW});
            return true;
        }
        this.gathering = true;
        let resource = this.resource;
        setTimeout(async () => {
            await this.completeGather(client, room, playerSchema, resource);
        }, resource.difficulty);
        return true;
    }

    /**
     * Complete the gathering loop: create the yielded item, grant experience,
     * track yields and schedule the node depletion.
     *
     * @param {Object} client
     * @param {Object} room
     * @param {Player} playerSchema
     * @param {Object} resource
     * @returns {Promise<boolean>}
     */
    async completeGather(client, room, playerSchema, resource)
    {
        this.gathering = false;
        let inventory = playerSchema.inventory.manager;
        let qty = sc.randomInteger(resource.minQty, resource.maxQty);
        let expGranted = resource.experience;
        // server event multipliers (double gathering) from the events feature:
        let doubleGathering = Boolean(
            room?.config?.getWithoutLogs?.('server/events/doubleGathering', false)
        );
        if(doubleGathering){
            qty = qty * 2;
            expGranted = expGranted * 2;
        }
        let itemInstance = inventory.createItemInstance(resource.itemKey, qty);
        if(false === itemInstance){
            Logger.error('GatheringObject: could not create item "'+resource.itemKey+'".');
            client.send('*', {act: GameConst.UI, id: this.id, content: SNIPPETS.OBJECT.NO_RESOURCE});
            return false;
        }
        let instances = !sc.isArray(itemInstance) ? [itemInstance] : itemInstance;
        let addResult = await inventory.addItems(instances);
        if(false === addResult){
            Logger.error('GatheringObject: could not add item.', inventory.lastError);
            return false;
        }
        expGranted = 0;
        if(0 < resource.experience && playerSchema.skillsServer?.classPath?.addExperience){
            try {
                await playerSchema.skillsServer.classPath.addExperience(resource.experience * (doubleGathering ? 2 : 1));
                expGranted = resource.experience * (doubleGathering ? 2 : 1);
            } catch (error) {
                Logger.error('GatheringObject: could not grant experience.', error.message);
            }
        }
        this.yields++;
        if(this.yields >= resource.maxYields){
            this.cooldownUntil = Date.now() + resource.respawnTime;
            this.yields = 0;
        }
        await this.events.emit('reldens.gathering.resourceGathered', {
            gatheringObject: this,
            playerSchema,
            resource,
            qty,
            room
        });
        client.send('*', {
            act: GameConst.UI,
            id: this.id,
            result: {
                success: true,
                itemLabel: resource.itemLabel,
                qty,
                exp: expGranted
            },
            listener: 'gathering'
        });
        return true;
    }

}

module.exports.GatheringObject = GatheringObject;
