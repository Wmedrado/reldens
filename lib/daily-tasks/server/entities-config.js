/**
 *
 * Reldens - Entities Config
 *
 * Admin panel properties configuration for the daily tasks entities.
 *
 */

const { DailyTasksEntityOverride } = require('./entities/daily-tasks-entity-override');
const { PlayersDailyTasksEntityOverride } = require('./entities/players-daily-tasks-entity-override');

module.exports.entitiesConfig = {
    dailyTasks: DailyTasksEntityOverride,
    playersDailyTasks: PlayersDailyTasksEntityOverride
};
