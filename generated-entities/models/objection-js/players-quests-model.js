/**
 *
 * Reldens - PlayersQuestsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class PlayersQuestsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'players_quests';
    }

    static get relationMappings()
    {
        const { PlayersModel } = require('./players-model');
        const { QuestsModel } = require('./quests-model');
        return {
            related_players: {
                relation: this.BelongsToOneRelation,
                modelClass: PlayersModel,
                join: {
                    from: this.tableName+'.player_id',
                    to: PlayersModel.tableName+'.id'
                }
            },
            related_quests: {
                relation: this.BelongsToOneRelation,
                modelClass: QuestsModel,
                join: {
                    from: this.tableName+'.quest_id',
                    to: QuestsModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.PlayersQuestsModel = PlayersQuestsModel;
