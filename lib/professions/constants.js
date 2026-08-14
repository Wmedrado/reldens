/**
 *
 * Reldens - Professions
 *
 * Per-skill leveling for profession skills (farming, woodcutting, mining,
 * fishing, foraging, cooking, crafting). Adapted from the Kaetram per-skill
 * XP model as a design pattern, implemented on Reldens data structures.
 *
 * Each profession skill has its own XP pool and level. The player class level
 * (classPath) keeps working as the character level; profession skills add a
 * second progression axis that gates recipes/resources and rewards the "grind"
 * of each activity.
 *
 */

const PROFESSION_SKILL_KEYS = [
    'farming',
    'woodcutting',
    'mining',
    'fishing',
    'foraging',
    'cooking',
    'crafting'
];

// cumulative XP required to reach a level:
//   expRequired(level) = xpBase * xpMultiplier ^ (level - 1)
// config keys: server/professions/xpBase, server/professions/xpMultiplier
const DEFAULT_XP_BASE = 100;
const DEFAULT_XP_MULTIPLIER = 1.25;

// map a gathering resource code prefix to a profession skill key:
const GATHERING_SKILL_BY_CODE = {
    tree: 'woodcutting',
    wood: 'woodcutting',
    rock: 'mining',
    ore: 'mining',
    mine: 'mining',
    fish: 'fishing',
    bush: 'foraging',
    herb: 'foraging',
    forage: 'foraging'
};

module.exports = {
    PROFESSION_SKILL_KEYS,
    DEFAULT_XP_BASE,
    DEFAULT_XP_MULTIPLIER,
    GATHERING_SKILL_BY_CODE
};
