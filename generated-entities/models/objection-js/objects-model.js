/**
 *
 * Reldens - ObjectsModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class ObjectsModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'objects';
    }

    static get relationMappings()
    {
        const { RoomsModel } = require('./rooms-model');
        const { ObjectsTypesModel } = require('./objects-types-model');
        const { CraftingRecipesModel } = require('./crafting-recipes-model');
        const { FarmingPlotsModel } = require('./farming-plots-model');
        const { GatheringResourcesModel } = require('./gathering-resources-model');
        const { ObjectsAnimationsModel } = require('./objects-animations-model');
        const { ObjectsAssetsModel } = require('./objects-assets-model');
        const { ObjectsDamageTypesModel } = require('./objects-damage-types-model');
        const { ObjectsDropTablesModel } = require('./objects-drop-tables-model');
        const { ObjectsItemsInventoryModel } = require('./objects-items-inventory-model');
        const { ObjectsItemsRequirementsModel } = require('./objects-items-requirements-model');
        const { ObjectsItemsRewardsModel } = require('./objects-items-rewards-model');
        const { ObjectsSkillsModel } = require('./objects-skills-model');
        const { ObjectsStatsModel } = require('./objects-stats-model');
        const { QuestsModel } = require('./quests-model');
        const { RespawnModel } = require('./respawn-model');
        const { RewardsModel } = require('./rewards-model');
        return {
            related_rooms: {
                relation: this.BelongsToOneRelation,
                modelClass: RoomsModel,
                join: {
                    from: this.tableName+'.room_id',
                    to: RoomsModel.tableName+'.id'
                }
            },
            related_objects_types: {
                relation: this.BelongsToOneRelation,
                modelClass: ObjectsTypesModel,
                join: {
                    from: this.tableName+'.class_type',
                    to: ObjectsTypesModel.tableName+'.id'
                }
            },
            related_crafting_recipes: {
                relation: this.HasManyRelation,
                modelClass: CraftingRecipesModel,
                join: {
                    from: this.tableName+'.id',
                    to: CraftingRecipesModel.tableName+'.object_id'
                }
            },
            related_farming_plots: {
                relation: this.HasOneRelation,
                modelClass: FarmingPlotsModel,
                join: {
                    from: this.tableName+'.id',
                    to: FarmingPlotsModel.tableName+'.object_id'
                }
            },
            related_gathering_resources: {
                relation: this.HasManyRelation,
                modelClass: GatheringResourcesModel,
                join: {
                    from: this.tableName+'.id',
                    to: GatheringResourcesModel.tableName+'.object_id'
                }
            },
            related_objects_animations: {
                relation: this.HasManyRelation,
                modelClass: ObjectsAnimationsModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsAnimationsModel.tableName+'.object_id'
                }
            },
            related_objects_assets: {
                relation: this.HasManyRelation,
                modelClass: ObjectsAssetsModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsAssetsModel.tableName+'.object_id'
                }
            },
            related_objects_damage_types: {
                relation: this.HasManyRelation,
                modelClass: ObjectsDamageTypesModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsDamageTypesModel.tableName+'.object_id'
                }
            },
            related_objects_drop_tables: {
                relation: this.HasManyRelation,
                modelClass: ObjectsDropTablesModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsDropTablesModel.tableName+'.object_id'
                }
            },
            related_objects_items_inventory: {
                relation: this.HasManyRelation,
                modelClass: ObjectsItemsInventoryModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsItemsInventoryModel.tableName+'.owner_id'
                }
            },
            related_objects_items_requirements: {
                relation: this.HasManyRelation,
                modelClass: ObjectsItemsRequirementsModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsItemsRequirementsModel.tableName+'.object_id'
                }
            },
            related_objects_items_rewards: {
                relation: this.HasManyRelation,
                modelClass: ObjectsItemsRewardsModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsItemsRewardsModel.tableName+'.object_id'
                }
            },
            related_objects_skills: {
                relation: this.HasManyRelation,
                modelClass: ObjectsSkillsModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsSkillsModel.tableName+'.object_id'
                }
            },
            related_objects_stats: {
                relation: this.HasManyRelation,
                modelClass: ObjectsStatsModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsStatsModel.tableName+'.object_id'
                }
            },
            related_quests: {
                relation: this.HasManyRelation,
                modelClass: QuestsModel,
                join: {
                    from: this.tableName+'.id',
                    to: QuestsModel.tableName+'.object_id'
                }
            },
            related_respawn: {
                relation: this.HasManyRelation,
                modelClass: RespawnModel,
                join: {
                    from: this.tableName+'.id',
                    to: RespawnModel.tableName+'.object_id'
                }
            },
            related_rewards: {
                relation: this.HasManyRelation,
                modelClass: RewardsModel,
                join: {
                    from: this.tableName+'.id',
                    to: RewardsModel.tableName+'.object_id'
                }
            }
        };
    }
}

module.exports.ObjectsModel = ObjectsModel;
