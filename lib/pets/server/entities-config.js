/**
 *
 * Reldens - Entities Config
 *
 * Admin panel properties configuration for the pets entities.
 *
 */

const { PetsEntityOverride } = require('./entities/pets-entity-override');
const { PlayersPetsEntityOverride } = require('./entities/players-pets-entity-override');

module.exports.entitiesConfig = {
    pets: PetsEntityOverride,
    playersPets: PlayersPetsEntityOverride
};
