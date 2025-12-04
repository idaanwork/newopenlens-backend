import 'dotenv/config';

export default {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'password',
      database: 'openlens'
    },
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  test: {
    client: 'pg',
    connection: process.env.DATABASE_URL_TEST || {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'password',
      database: 'openlens_test'
    },
    migrations: {
      directory: './migrations'
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations'
    },
    ssl: true
  }
};
