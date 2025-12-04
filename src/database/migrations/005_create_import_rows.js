export const up = async (knex) => {
  return knex.schema.createTable('import_rows', (table) => {
    table.increments('id').primary();
    table.integer('import_id').unsigned().notNullable();
    table.string('source_id');
    table.json('raw_json');
    table.integer('mapped_library_id').unsigned();
    table.enum('status', ['pending', 'mapped', 'reconciling', 'complete', 'ignored']).defaultTo('pending');
    table.timestamps(true, true);
    table.foreign('import_id').references('imports.id').onDelete('CASCADE');
    table.foreign('mapped_library_id').references('libraries.id').onDelete('SET NULL');
    table.index(['import_id']);
    table.index(['status']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTableIfExists('import_rows');
};
