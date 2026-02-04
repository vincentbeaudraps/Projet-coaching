import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../coaching.db');

// Create SQLite database connection
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export interface QueryResult {
  rows: any[];
  rowCount: number;
}

// Wrapper to mimic pg.Client interface
export const sqliteClient = {
  query: (sql: string, params: any[] = []): Promise<QueryResult> => {
    return new Promise((resolve, reject) => {
      try {
        // Normalize SQL from PostgreSQL style to SQLite
        let normalizedSql = sql
          .replace(/\$(\d+)/g, '?') // Replace $1, $2 with ?
          .replace(/DEFAULT gen_random_uuid\(\)/g, 'DEFAULT (lower(hex(randomblob(16))))') // UUID generation
          .replace(/gen_random_uuid\(\)/g, 'lower(hex(randomblob(16)))'); // UUID generation in values

        if (normalizedSql.trim().toUpperCase().startsWith('SELECT')) {
          const stmt = db.prepare(normalizedSql);
          const rows = stmt.all(...params);
          resolve({ rows, rowCount: rows.length });
        } else if (normalizedSql.trim().toUpperCase().startsWith('INSERT') || 
                   normalizedSql.trim().toUpperCase().startsWith('UPDATE') || 
                   normalizedSql.trim().toUpperCase().startsWith('DELETE')) {
          const stmt = db.prepare(normalizedSql);
          const result = stmt.run(...params);
          resolve({ rows: [], rowCount: result.changes });
        } else if (normalizedSql.trim().toUpperCase().startsWith('CREATE') || 
                   normalizedSql.trim().toUpperCase().startsWith('DROP')) {
          const stmt = db.prepare(normalizedSql);
          stmt.run(...params);
          resolve({ rows: [], rowCount: 0 });
        } else {
          const stmt = db.prepare(normalizedSql);
          const result = stmt.run(...params);
          resolve({ rows: [], rowCount: result.changes });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  connect: (): Promise<void> => {
    return Promise.resolve();
  },

  end: (): Promise<void> => {
    db.close();
    return Promise.resolve();
  }
};

export default sqliteClient;
