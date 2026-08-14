/**
 *
 * Reldens - PlayersEnergyModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class PlayersEnergyModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'players_energy';
    }

    static get idColumn()
    {
        return 'player_id';
    }

    static get relationMappings()
    {
        const { PlayersModel } = require('./players-model');
        return {
            related_players: {
                relation: this.BelongsToOneRelation,
                modelClass: PlayersModel,
                join: {
                    from: this.tableName+'.player_id',
                    to: PlayersModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.PlayersEnergyModel = PlayersEnergyModel;
