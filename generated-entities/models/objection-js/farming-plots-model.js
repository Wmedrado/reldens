/**
 *
 * Reldens - FarmingPlotsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class FarmingPlotsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'farming_plots';
    }

    static get relationMappings()
    {
        const { ObjectsModel } = require('./objects-model');
        const { PlayersModel } = require('./players-model');
        const { FarmingCropsModel } = require('./farming-crops-model');
        return {
            related_objects: {
                relation: this.BelongsToOneRelation,
                modelClass: ObjectsModel,
                join: {
                    from: this.tableName+'.object_id',
                    to: ObjectsModel.tableName+'.id'
                }
            },
            related_players: {
                relation: this.BelongsToOneRelation,
                modelClass: PlayersModel,
                join: {
                    from: this.tableName+'.player_id',
                    to: PlayersModel.tableName+'.id'
                }
            },
            related_farming_crops: {
                relation: this.BelongsToOneRelation,
                modelClass: FarmingCropsModel,
                join: {
                    from: this.tableName+'.crop_id',
                    to: FarmingCropsModel.tableName+'.id'
                }
            }
        };
    }
}

module.exports.FarmingPlotsModel = FarmingPlotsModel;
