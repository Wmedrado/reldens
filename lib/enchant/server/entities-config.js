/**
 *
 * Reldens - Entities Config
 *
 * Admin panel properties configuration for the enchant entities.
 *
 */

const { EnchantmentsEntityOverride } = require('./entities/enchantments-entity-override');

module.exports.entitiesConfig = {
    enchantments: EnchantmentsEntityOverride
};
