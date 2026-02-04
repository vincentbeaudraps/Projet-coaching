import { Client } from 'pg';
import dotenv from 'dotenv';
import { sqliteClient } from './sqlite.js';

dotenv.config();

let _client: any = null;
let isUsingSQLite = false;

const pgClient = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export async function connectDB() {
  try {
    // Try to connect to PostgreSQL first
    await pgClient.connect();
    _client = pgClient;
    console.log('Connected to PostgreSQL');
    isUsingSQLite = false;
  } catch (err: any) {
    console.warn('PostgreSQL connection failed, using SQLite for development:', err.message);
    _client = sqliteClient;
    await _client.connect();
    console.log('Using SQLite for development');
    isUsingSQLite = true;
  }
}

export function isUsingDatabase() {
  return isUsingSQLite ? 'sqlite' : 'postgresql';
}

// Create a proxy object that will dynamically access the connected client
export const client = {
  query: (sql: string, params: any[] = []) => {
    if (!_client) throw new Error('Database not connected');
    return _client.query(sql, params);
  },
  connect: () => {
    if (!_client) throw new Error('Database not connected');
    return _client.connect();
  },
  end: () => {
    if (!_client) throw new Error('Database not connected');
    return _client.end();
  }
};

export default client;
