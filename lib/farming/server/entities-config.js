/**
 *
 * Reldens - Entities Config
 *
 * Admin panel properties configuration for the farming entities.
 *
 */

const { FarmingCropsEntityOverride } = require('./entities/farming-crops-entity-override');
const { FarmingPlotsEntityOverride } = require('./entities/farming-plots-entity-override');

module.exports.entitiesConfig = {
    farmingCrops: FarmingCropsEntityOverride,
    farmingPlots: FarmingPlotsEntityOverride
};
