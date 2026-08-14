/**
 *
 * Reldens - PlayersProfessionSkillsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class PlayersProfessionSkillsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'players_profession_skills';
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

module.exports.PlayersProfessionSkillsModel = PlayersProfessionSkillsModel;
