import knex from 'knex';
import knexfile from './knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

export const db = knex(config);

export const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

export default db;
