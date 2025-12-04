export const up = async (knex) => {
  return knex.schema.createTable('imports', (table) => {
    table.increments('id').primary();
    table.string('filename').notNullable();
    table.integer('uploaded_by_user_id').unsigned().notNullable();
    table.integer('rows_count').defaultTo(0);
    table.string('storage_key');
    table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
    table.timestamps(true, true);
    table.foreign('uploaded_by_user_id').references('users.id').onDelete('CASCADE');
    table.index(['status']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTableIfExists('imports');
};
