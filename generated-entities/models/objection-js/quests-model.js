/**
 *
 * Reldens - QuestsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class QuestsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'quests';
    }

    static get relationMappings()
    {
        const { ObjectsModel } = require('./objects-model');
        const { PlayersQuestsModel } = require('./players-quests-model');
        const { QuestsObjectivesModel } = require('./quests-objectives-model');
        const { QuestsRewardsModel } = require('./quests-rewards-model');
        return {
            related_objects: {
                relation: this.BelongsToOneRelation,
                modelClass: ObjectsModel,
                join: {
                    from: this.tableName+'.object_id',
                    to: ObjectsModel.tableName+'.id'
                }
            },
            related_players_quests: {
                relation: this.HasManyRelation,
                modelClass: PlayersQuestsModel,
                join: {
                    from: this.tableName+'.id',
                    to: PlayersQuestsModel.tableName+'.quest_id'
                }
            },
            related_quests_objectives: {
                relation: this.HasManyRelation,
                modelClass: QuestsObjectivesModel,
                join: {
                    from: this.tableName+'.id',
                    to: QuestsObjectivesModel.tableName+'.quest_id'
                }
            },
            related_quests_rewards: {
                relation: this.HasManyRelation,
                modelClass: QuestsRewardsModel,
                join: {
                    from: this.tableName+'.id',
                    to: QuestsRewardsModel.tableName+'.quest_id'
                }
            }
        };
    }
}

module.exports.QuestsModel = QuestsModel;
