/**
 *
 * Reldens - Entities Config
 *
 * Admin panel properties configuration for the bank entities.
 *
 */

const { BankItemsEntityOverride } = require('./entities/bank-items-entity-override');

module.exports.entitiesConfig = {
    bankItems: BankItemsEntityOverride
};
