export const up = async (knex) => {
  return knex.schema.createTable('vulnerabilities', (table) => {
    table.increments('id').primary();
    table.integer('library_id').unsigned().notNullable();
    table.string('cve_id').notNullable();
    table.enum('severity', ['critical', 'high', 'medium', 'low', 'unknown']).defaultTo('unknown');
    table.text('description');
    table.date('published_date');
    table.string('fixed_in');
    table.timestamps(true, true);
    table.foreign('library_id').references('libraries.id').onDelete('CASCADE');
    table.index(['library_id']);
    table.index(['cve_id']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTableIfExists('vulnerabilities');
};
