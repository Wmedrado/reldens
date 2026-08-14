/**
 *
 * Reldens - Entities Config
 *
 * Admin panel properties configuration for the achievements entities.
 *
 */

const { AchievementsEntityOverride } = require('./entities/achievements-entity-override');
const { PlayersAchievementsEntityOverride } = require('./entities/players-achievements-entity-override');

module.exports.entitiesConfig = {
    achievements: AchievementsEntityOverride,
    playersAchievements: PlayersAchievementsEntityOverride
};
