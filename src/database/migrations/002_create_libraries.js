export const up = async (knex) => {
  return knex.schema.createTable('libraries', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('version').notNullable();
    table.string('purl');
    table.string('license_declared');
    table.string('license_detected');
    table.integer('vulnerability_count').defaultTo(0);
    table.string('owner');
    table.string('environment');
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);
    table.unique(['name', 'version']);
    table.index(['deleted_at']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTableIfExists('libraries');
};
