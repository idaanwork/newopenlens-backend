export const up = async (knex) => {
  return knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned();
    table.string('action').notNullable();
    table.string('target_type');
    table.integer('target_id');
    table.json('data');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('users.id').onDelete('SET NULL');
    table.index(['user_id']);
    table.index(['created_at']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTableIfExists('audit_logs');
};
