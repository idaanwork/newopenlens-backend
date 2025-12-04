export const up = async (knex) => {
  return knex.schema.createTable('mappings', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('name').notNullable();
    table.json('mapping_json').notNullable();
    table.timestamps(true, true);
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index(['user_id']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTableIfExists('mappings');
};
