/**
 *
 * Reldens - KnexMigrationsDevLockModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class KnexMigrationsDevLockModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'knex_migrations_dev_lock';
    }

    static get idColumn()
    {
        return 'index';
    }

}

module.exports.KnexMigrationsDevLockModel = KnexMigrationsDevLockModel;
