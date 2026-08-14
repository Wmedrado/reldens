/**
 *
 * Reldens - PetObject
 *
 * Pet dealer NPC (adapted from the Kaetram pet system). The player adopts a
 * pet by spending the pet adoption item (e.g. a "pet egg"). The owned pet is
 * persisted on the "players_pets" table and attached to the player's initial
 * game data so the client can display it.
 *
 */

const { NpcObject } = require('../../objects/server/object/type/npc-object');
const { GameConst } = require('../../game/constants');
const { TYPE_PET_DEALER, OPTION_PETS, ACTION_ADOPT, SNIPPETS } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('../../users/server/player').Player} Player
 */
class PetObject extends NpcObject
{

    /**
     * @param {Object} props
     */
    constructor(props)
    {
        super(props);
        this.type = TYPE_PET_DEALER;
        this.eventsPrefix = this.uid+'.pet';
        this.clientParams.type = TYPE_PET_DEALER;
        this.content = sc.get(this.clientParams, 'content', SNIPPETS.OBJECT.CONTENT);
        this.options = sc.get(this.clientParams, 'options', {
            [OPTION_PETS]: {
                label: SNIPPETS.OBJECT.OPTIONS.PETS,
                value: OPTION_PETS
            }
        });
        this.pets = {};
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
            Logger.error('PetObject: Data Server was not specified.');
            return;
        }
        await this.loadPets();
    }

    /**
     * @returns {Promise<void>}
     */
    async loadPets()
    {
        let repository = this.dataServer.getEntity('pets');
        if(!repository){
            Logger.error('PetObject: "pets" entity not found, run "reldens generateEntities".');
            return;
        }
        let rows = await repository.loadByWithRelations('is_active', 1, ['related_items_item']);
        for(let row of rows){
            this.pets[row.key] = {
                key: row.key,
                label: row.label,
                adoptItemKey: row.related_items_item?.key || false,
                adoptItemLabel: row.related_items_item?.label || row.adopt_item_id
            };
        }
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
        if(!this.dataServer){
            return false;
        }
        if(ACTION_ADOPT === sc.get(data, 'act', '')){
            await this.adoptPet(playerSchema, sc.get(data, 'key', ''));
            return await this.openPets(client, playerSchema);
        }
        if(OPTION_PETS === sc.get(data, 'value', 'init')){
            return await this.openPets(client, playerSchema);
        }
        return false;
    }

    /**
     * @param {Object} client
     * @param {Player} playerSchema
     * @returns {Promise<boolean>}
     */
    async openPets(client, playerSchema)
    {
        let owned = await this.ownedPet(playerSchema.player_id);
        let available = [];
        for(let key of Object.keys(this.pets)){
            if(owned && key === owned.pet_key){
                continue;
            }
            let pet = this.pets[key];
            available.push({key: pet.key, label: pet.label, adoptItemLabel: pet.adoptItemLabel});
        }
        client.send('*', {
            act: GameConst.UI,
            id: this.id,
            result: {owned, available},
            listener: 'pet'
        });
        return true;
    }

    /**
     * @param {number} playerId
     * @returns {Promise<Object|null>}
     */
    async ownedPet(playerId)
    {
        let repository = this.dataServer.getEntity('playersPets');
        let row = await repository.loadOneBy('player_id', playerId);
        if(!row){
            return null;
        }
        let pet = sc.get(this.pets, row.pet_key, {label: row.pet_key});
        return {pet_key: row.pet_key, label: pet.label, level: Number(row.level || 1), exp: Number(row.exp || 0)};
    }

    /**
     * @param {Player} playerSchema
     * @param {string} petKey
     * @returns {Promise<boolean>}
     */
    async adoptPet(playerSchema, petKey)
    {
        let pet = sc.get(this.pets, petKey, false);
        if(!pet || false === pet.adoptItemKey){
            return false;
        }
        let owned = await this.ownedPet(playerSchema.player_id);
        if(owned){
            return false;
        }
        let inventory = playerSchema.inventory.manager;
        if(!this.ownsQuantity(inventory, pet.adoptItemKey, 1)){
            return false;
        }
        let consumed = await this.consumeKey(inventory, pet.adoptItemKey, 1);
        if(false === consumed){
            return false;
        }
        let repository = this.dataServer.getEntity('playersPets');
        let created = await repository.create({player_id: playerSchema.player_id, pet_key: petKey, level: 1, exp: 0});
        return Boolean(created);
    }

    /**
     * @param {Object} inventory
     * @param {string} key
     * @param {number} qty
     * @returns {boolean}
     */
    ownsQuantity(inventory, key, qty)
    {
        let total = 0;
        for(let i of Object.keys(inventory.items)){
            if(inventory.items[i].key === key){
                total += inventory.items[i].qty;
            }
        }
        return total >= qty;
    }

    /**
     * @param {Object} inventory
     * @param {string} key
     * @param {number} qty
     * @returns {Promise<boolean>}
     */
    async consumeKey(inventory, key, qty)
    {
        let remaining = qty;
        for(let i of Object.keys(inventory.items)){
            if(0 >= remaining){
                break;
            }
            let item = inventory.items[i];
            if(item.key !== key){
                continue;
            }
            if(item.qty <= remaining){
                remaining -= item.qty;
                let removed = await inventory.removeItem(i);
                if(false === removed){
                    return false;
                }
                continue;
            }
            let decreased = await inventory.decreaseItemQty(i, remaining);
            if(false === decreased){
                return false;
            }
            remaining = 0;
        }
        return 0 === remaining;
    }

}

module.exports.PetObject = PetObject;
