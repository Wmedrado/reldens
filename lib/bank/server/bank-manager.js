/**
 *
 * Reldens - BankManager
 *
 * Per-player bank container (adapted from Kaetram bank). Items are stored as
 * item key + quantity on the "bank_items" table. The bank moves items between
 * the player inventory and the bank rows.
 *
 */

const { Logger, sc } = require('@reldens/utils');

class BankManager
{

    /**
     * @param {Object} props
     * @param {Object} props.dataServer
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
    }

    /**
     * @returns {Object|boolean}
     */
    repository()
    {
        let repository = this.dataServer.getEntity('bankItems');
        if(!repository){
            Logger.error('BankManager: "bankItems" entity not found, run "reldens generateEntities".');
        }
        return repository;
    }

    /**
     * @param {number} playerId
     * @param {string} itemKey
     * @returns {Promise<Object|null>}
     */
    async rowForPlayerItem(playerId, itemKey)
    {
        let repository = this.repository();
        if(!repository){
            return null;
        }
        return await repository.loadOne({player_id: playerId, item_key: itemKey});
    }

    /**
     * @param {number} playerId
     * @returns {Promise<Array<Object>>}
     */
    async rowsForPlayer(playerId)
    {
        let repository = this.repository();
        if(!repository){
            return [];
        }
        return await repository.loadBy('player_id', playerId);
    }

    /**
     * @param {number} playerId
     * @param {string} itemKey
     * @param {number} qty
     * @returns {Promise<boolean>}
     */
    async add(playerId, itemKey, qty)
    {
        let repository = this.repository();
        if(!repository){
            return false;
        }
        if(qty <= 0){
            return false;
        }
        let row = await this.rowForPlayerItem(playerId, itemKey);
        if(row){
            await repository.updateById(row.id, {qty: Number(row.qty) + qty});
            return true;
        }
        let created = await repository.create({player_id: playerId, item_key: itemKey, qty});
        return Boolean(created);
    }

    /**
     * @param {number} playerId
     * @param {string} itemKey
     * @param {number} qty
     * @returns {Promise<boolean>}
     */
    async remove(playerId, itemKey, qty)
    {
        let repository = this.repository();
        if(!repository){
            return false;
        }
        if(qty <= 0){
            return false;
        }
        let row = await this.rowForPlayerItem(playerId, itemKey);
        if(!row || Number(row.qty) < qty){
            return false;
        }
        let newQty = Number(row.qty) - qty;
        if(newQty <= 0){
            await repository.deleteById(row.id);
            return true;
        }
        await repository.updateById(row.id, {qty: newQty});
        return true;
    }

    /**
     * Move a quantity of an inventory item into the bank.
     *
     * @param {Object} playerSchema
     * @param {string} inventoryIdx
     * @param {number} qty
     * @returns {Promise<boolean>}
     */
    async deposit(playerSchema, inventoryIdx, qty)
    {
        let inventory = playerSchema.inventory.manager;
        let item = sc.get(inventory.items, inventoryIdx, false);
        if(!item || qty <= 0 || qty > item.qty){
            return false;
        }
        let moved = await this.add(playerSchema.player_id, item.key, qty);
        if(!moved){
            return false;
        }
        if(qty >= item.qty){
            await inventory.removeItem(inventoryIdx);
            return true;
        }
        await inventory.decreaseItemQty(inventoryIdx, qty);
        return true;
    }

    /**
     * Move a quantity of a bank item back into the inventory.
     *
     * @param {Object} playerSchema
     * @param {string} itemKey
     * @param {number} qty
     * @returns {Promise<boolean>}
     */
    async withdraw(playerSchema, itemKey, qty)
    {
        let inventory = playerSchema.inventory.manager;
        let removed = await this.remove(playerSchema.player_id, itemKey, qty);
        if(!removed){
            return false;
        }
        let itemInstance = inventory.createItemInstance(itemKey, qty);
        if(false === itemInstance){
            Logger.error('BankManager: could not create item "'+itemKey+'".');
            return false;
        }
        let instances = !sc.isArray(itemInstance) ? [itemInstance] : itemInstance;
        let addResult = await inventory.addItems(instances);
        if(false === addResult){
            Logger.error('BankManager: could not add withdrawn item.', inventory.lastError);
            return false;
        }
        return true;
    }

}

module.exports.BankManager = BankManager;
