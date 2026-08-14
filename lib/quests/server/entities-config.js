/**
 *
 * Reldens - Entities Config
 *
 * Admin panel properties configuration for the quests entities.
 *
 */

const { QuestsEntityOverride } = require('./entities/quests-entity-override');
const { QuestsObjectivesEntityOverride } = require('./entities/quests-objectives-entity-override');
const { QuestsRewardsEntityOverride } = require('./entities/quests-rewards-entity-override');
const { PlayersQuestsEntityOverride } = require('./entities/players-quests-entity-override');

module.exports.entitiesConfig = {
    quests: QuestsEntityOverride,
    questsObjectives: QuestsObjectivesEntityOverride,
    questsRewards: QuestsRewardsEntityOverride,
    playersQuests: PlayersQuestsEntityOverride
};
