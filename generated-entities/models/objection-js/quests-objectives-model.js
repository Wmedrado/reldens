/**
 *
 * Reldens - QuestsObjectivesModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class QuestsObjectivesModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'quests_objectives';
    }

    static get relationMappings()
    {
        const { QuestsModel } = require('./quests-model');
        return {
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

module.exports.QuestsObjectivesModel = QuestsObjectivesModel;
