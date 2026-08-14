/**
 *
 * Reldens - KnexMigrationsDevModel
 *
 */

const { ObjectionJsRawModel } = require('@reldens/storage');

class KnexMigrationsDevModel extends ObjectionJsRawModel
{

    static get tableName()
    {
        return 'knex_migrations_dev';
    }

}

module.exports.KnexMigrationsDevModel = KnexMigrationsDevModel;
