export const up = async (knex) => {
  return knex.schema.createTable('reconciliation_queue', (table) => {
    table.increments('id').primary();
    table.integer('import_row_id').unsigned().notNullable();
    table.string('suggested_lib_name');
    table.string('suggested_version');
    table.string('detected_license');
    table.enum('status', ['pending', 'accepted', 'merged', 'overridden', 'ignored']).defaultTo('pending');
    table.float('confidence').defaultTo(0);
    table.timestamps(true, true);
    table.foreign('import_row_id').references('import_rows.id').onDelete('CASCADE');
    table.index(['import_row_id']);
    table.index(['status']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTableIfExists('reconciliation_queue');
};
