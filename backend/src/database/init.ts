import { client } from './connection.js';

export async function initializeDatabase() {
  if (!client) {
    console.warn('Database client not initialized');
    return;
  }

  try {
    console.log('Initializing database...');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('coach', 'athlete')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Athletes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS athletes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        coach_id TEXT NOT NULL REFERENCES users(id),
        age INT,
        level VARCHAR(100),
        goals TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Training sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_sessions (
        id TEXT PRIMARY KEY,
        coach_id TEXT NOT NULL REFERENCES users(id),
        athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(100),
        distance DECIMAL(10, 2),
        duration INT NOT NULL,
        intensity VARCHAR(50),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL REFERENCES users(id),
        receiver_id TEXT NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Performance records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_records (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
        session_id TEXT REFERENCES training_sessions(id),
        actual_distance DECIMAL(10, 2),
        actual_duration INT NOT NULL,
        avg_heart_rate INT,
        max_heart_rate INT,
        notes TEXT,
        recorded_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}
