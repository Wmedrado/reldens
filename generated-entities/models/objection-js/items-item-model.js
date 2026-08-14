/**
 *
 * Reldens - ItemsItemModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class ItemsItemModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'items_item';
    }

    static get relationMappings()
    {
        const { ItemsTypesModel } = require('./items-types-model');
        const { ItemsGroupModel } = require('./items-group-model');
        const { AchievementsModel } = require('./achievements-model');
        const { CraftingRecipesItemsModel } = require('./crafting-recipes-items-model');
        const { DropTablesItemsModel } = require('./drop-tables-items-model');
        const { DropsAnimationsModel } = require('./drops-animations-model');
        const { EnchantmentsModel } = require('./enchantments-model');
        const { FarmingCropsModel } = require('./farming-crops-model');
        const { GatheringResourcesModel } = require('./gathering-resources-model');
        const { ItemsInventoryModel } = require('./items-inventory-model');
        const { ItemsItemModifiersModel } = require('./items-item-modifiers-model');
        const { ObjectsItemsInventoryModel } = require('./objects-items-inventory-model');
        const { ObjectsItemsRequirementsModel } = require('./objects-items-requirements-model');
        const { ObjectsItemsRewardsModel } = require('./objects-items-rewards-model');
        const { PetsModel } = require('./pets-model');
        const { QuestsRewardsModel } = require('./quests-rewards-model');
        const { RewardsModel } = require('./rewards-model');
        return {
            related_items_types: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsTypesModel,
                join: {
                    from: this.tableName+'.type',
                    to: ItemsTypesModel.tableName+'.id'
                }
            },
            related_items_group: {
                relation: this.BelongsToOneRelation,
                modelClass: ItemsGroupModel,
                join: {
                    from: this.tableName+'.group_id',
                    to: ItemsGroupModel.tableName+'.id'
                }
            },
            related_achievements: {
                relation: this.HasManyRelation,
                modelClass: AchievementsModel,
                join: {
                    from: this.tableName+'.id',
                    to: AchievementsModel.tableName+'.reward_item_id'
                }
            },
            related_crafting_recipes_items: {
                relation: this.HasManyRelation,
                modelClass: CraftingRecipesItemsModel,
                join: {
                    from: this.tableName+'.id',
                    to: CraftingRecipesItemsModel.tableName+'.item_id'
                }
            },
            related_drop_tables_items: {
                relation: this.HasManyRelation,
                modelClass: DropTablesItemsModel,
                join: {
                    from: this.tableName+'.id',
                    to: DropTablesItemsModel.tableName+'.item_id'
                }
            },
            related_drops_animations: {
                relation: this.HasOneRelation,
                modelClass: DropsAnimationsModel,
                join: {
                    from: this.tableName+'.id',
                    to: DropsAnimationsModel.tableName+'.item_id'
                }
            },
            related_enchantments_input_item: {
                relation: this.HasManyRelation,
                modelClass: EnchantmentsModel,
                join: {
                    from: this.tableName+'.id',
                    to: EnchantmentsModel.tableName+'.input_item_id'
                }
            },
            related_enchantments_catalyst_item: {
                relation: this.HasManyRelation,
                modelClass: EnchantmentsModel,
                join: {
                    from: this.tableName+'.id',
                    to: EnchantmentsModel.tableName+'.catalyst_item_id'
                }
            },
            related_enchantments_output_item: {
                relation: this.HasManyRelation,
                modelClass: EnchantmentsModel,
                join: {
                    from: this.tableName+'.id',
                    to: EnchantmentsModel.tableName+'.output_item_id'
                }
            },
            related_farming_crops_seed_item: {
                relation: this.HasManyRelation,
                modelClass: FarmingCropsModel,
                join: {
                    from: this.tableName+'.id',
                    to: FarmingCropsModel.tableName+'.seed_item_id'
                }
            },
            related_farming_crops_harvest_item: {
                relation: this.HasManyRelation,
                modelClass: FarmingCropsModel,
                join: {
                    from: this.tableName+'.id',
                    to: FarmingCropsModel.tableName+'.harvest_item_id'
                }
            },
            related_gathering_resources: {
                relation: this.HasManyRelation,
                modelClass: GatheringResourcesModel,
                join: {
                    from: this.tableName+'.id',
                    to: GatheringResourcesModel.tableName+'.item_id'
                }
            },
            related_items_inventory: {
                relation: this.HasManyRelation,
                modelClass: ItemsInventoryModel,
                join: {
                    from: this.tableName+'.id',
                    to: ItemsInventoryModel.tableName+'.item_id'
                }
            },
            related_items_item_modifiers: {
                relation: this.HasManyRelation,
                modelClass: ItemsItemModifiersModel,
                join: {
                    from: this.tableName+'.id',
                    to: ItemsItemModifiersModel.tableName+'.item_id'
                }
            },
            related_objects_items_inventory: {
                relation: this.HasManyRelation,
                modelClass: ObjectsItemsInventoryModel,
                join: {
                    from: this.tableName+'.id',
                    to: ObjectsItemsInventoryModel.tableName+'.item_id'
                }
            },
            related_objects_items_requirements_item_key: {
                relation: this.HasManyRelation,
                modelClass: ObjectsItemsRequirementsModel,
                join: {
                    from: this.tableName+'.key',
                    to: ObjectsItemsRequirementsModel.tableName+'.item_key'
                }
            },
            related_objects_items_requirements_required_item_key: {
                relation: this.HasManyRelation,
                modelClass: ObjectsItemsRequirementsModel,
                join: {
                    from: this.tableName+'.key',
                    to: ObjectsItemsRequirementsModel.tableName+'.required_item_key'
                }
            },
            related_objects_items_rewards_item_key: {
                relation: this.HasManyRelation,
                modelClass: ObjectsItemsRewardsModel,
                join: {
                    from: this.tableName+'.key',
                    to: ObjectsItemsRewardsModel.tableName+'.item_key'
                }
            },
            related_objects_items_rewards_reward_item_key: {
                relation: this.HasManyRelation,
                modelClass: ObjectsItemsRewardsModel,
                join: {
                    from: this.tableName+'.key',
                    to: ObjectsItemsRewardsModel.tableName+'.reward_item_key'
                }
            },
            related_pets: {
                relation: this.HasManyRelation,
                modelClass: PetsModel,
                join: {
                    from: this.tableName+'.id',
                    to: PetsModel.tableName+'.adopt_item_id'
                }
            },
            related_quests_rewards: {
                relation: this.HasManyRelation,
                modelClass: QuestsRewardsModel,
                join: {
                    from: this.tableName+'.id',
                    to: QuestsRewardsModel.tableName+'.item_id'
                }
            },
            related_rewards: {
                relation: this.HasManyRelation,
                modelClass: RewardsModel,
                join: {
                    from: this.tableName+'.id',
                    to: RewardsModel.tableName+'.item_id'
                }
            }
        };
    }
}

module.exports.ItemsItemModel = ItemsItemModel;
