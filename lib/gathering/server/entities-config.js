/**
 *
 * Reldens - Entities Config
 *
 * Admin panel properties configuration for the gathering entities.
 *
 */

const { GatheringResourcesEntityOverride } = require('./entities/gathering-resources-entity-override');

module.exports.entitiesConfig = {
    gatheringResources: GatheringResourcesEntityOverride
};
