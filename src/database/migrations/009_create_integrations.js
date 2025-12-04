export const up = async (knex) => {
  return knex.schema.createTable('integrations', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.enum('type', ['github', 'jira', 'snyk']).notNullable();
    table.json('config').notNullable();
    table.timestamp('connected_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.unique(['user_id', 'type']);
    table.index(['user_id']);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTableIfExists('integrations');
};
