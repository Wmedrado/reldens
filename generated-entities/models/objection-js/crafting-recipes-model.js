/**
 *
 * Reldens - CraftingRecipesModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class CraftingRecipesModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'crafting_recipes';
    }

    static get relationMappings()
    {
        const { ObjectsModel } = require('./objects-model');
        const { SkillsSkillModel } = require('./skills-skill-model');
        const { CraftingRecipesItemsModel } = require('./crafting-recipes-items-model');
        return {
            related_objects: {
                relation: this.BelongsToOneRelation,
                modelClass: ObjectsModel,
                join: {
                    from: this.tableName+'.object_id',
                    to: ObjectsModel.tableName+'.id'
                }
            },
            related_skills_skill: {
                relation: this.BelongsToOneRelation,
                modelClass: SkillsSkillModel,
                join: {
                    from: this.tableName+'.skill_id',
                    to: SkillsSkillModel.tableName+'.id'
                }
            },
            related_crafting_recipes_items: {
                relation: this.HasManyRelation,
                modelClass: CraftingRecipesItemsModel,
                join: {
                    from: this.tableName+'.id',
                    to: CraftingRecipesItemsModel.tableName+'.recipe_id'
                }
            }
        };
    }
}

module.exports.CraftingRecipesModel = CraftingRecipesModel;
