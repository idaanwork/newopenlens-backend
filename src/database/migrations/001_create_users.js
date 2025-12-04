export const up = async (knex) => {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.enum('role', ['admin', 'user']).defaultTo('user');
    table.timestamps(true, true);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTableIfExists('users');
};
