/**
 *
 * Reldens - PetPlugin
 *
 * Attaches the player's owned pet to the super initial game data so the
 * client can display it.
 *
 */

const { Logger, sc } = require('@reldens/utils');

class PetPlugin
{

    /**
     * @param {Object} props
     * @param {Object} props.events
     * @param {Object} props.dataServer
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.events = sc.get(props, 'events', false);
        /** @type {Object|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
    }

    /**
     * @returns {boolean}
     */
    setup()
    {
        if(!this.events){
            Logger.error('PetPlugin: EventsManager undefined.');
            return false;
        }
        this.events.on('reldens.beforeSuperInitialGameData', async (superInitialGameData, roomGame, client, userModel) => {
            let pet = await this.petForAccount(userModel.id);
            superInitialGameData.pet = pet;
        });
        return true;
    }

    /**
     * @param {number} accountId
     * @returns {Promise<Object|null>}
     */
    async petForAccount(accountId)
    {
        if(!this.dataServer){
            return null;
        }
        let repository = this.dataServer.getEntity('playersPets');
        if(!repository){
            return null;
        }
        let row = await repository.loadOneBy('player_id', accountId);
        if(!row){
            return null;
        }
        let petsRepository = this.dataServer.getEntity('pets');
        let pet = petsRepository ? await petsRepository.loadOneBy('key', row.pet_key) : null;
        return {
            pet_key: row.pet_key,
            label: pet?.label || row.pet_key,
            level: Number(row.level || 1)
        };
    }

}

module.exports.PetPlugin = PetPlugin;
