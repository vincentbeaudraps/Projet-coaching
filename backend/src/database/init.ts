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
        -- Métriques physiques enrichies
        weight DECIMAL(5,2),
        height DECIMAL(5,2),
        vma DECIMAL(4,2),
        max_heart_rate INT,
        resting_heart_rate INT,
        birth_date DATE,
        gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
        -- Informations complémentaires
        profile_photo_url VARCHAR(500),
        city VARCHAR(100),
        running_experience_years INT,
        preferred_distances TEXT,
        injury_history TEXT,
        medical_notes TEXT,
        -- Statistiques calculées
        total_distance_km DECIMAL(10,2) DEFAULT 0,
        total_time_hours DECIMAL(10,2) DEFAULT 0,
        total_sessions INT DEFAULT 0,
        avg_pace VARCHAR(10),
        -- Dates
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        blocks TEXT,
        notes TEXT,
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
        read BOOLEAN DEFAULT FALSE,
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

    // Invitation codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invitation_codes (
        id TEXT PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        coach_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        used BOOLEAN DEFAULT FALSE,
        used_by TEXT REFERENCES users(id),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN (
          'new_session',
          'session_modified',
          'session_deleted',
          'new_message',
          'activity_completed',
          'goal_achieved',
          'record_broken',
          'invitation_accepted',
          'feedback_received'
        )),
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(500),
        related_id TEXT,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for notifications
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);

    // Table: session_feedback (NEW for Sprint 2)
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_feedback (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feeling_rating INTEGER CHECK (feeling_rating >= 1 AND feeling_rating <= 5),
        difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
        fatigue_rating INTEGER CHECK (fatigue_rating >= 1 AND fatigue_rating <= 5),
        athlete_notes TEXT,
        coach_comment TEXT,
        completed_distance DECIMAL(10,2),
        completed_duration INTEGER,
        avg_heart_rate INTEGER,
        avg_pace VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for session_feedback
    await client.query(`CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON session_feedback(session_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_feedback_athlete_id ON session_feedback(athlete_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON session_feedback(created_at DESC)`);

    // Table: goals (NEW for Sprint 3)
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coach_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('race', 'distance', 'time', 'pace', 'vma', 'weight', 'other')),
        target_value VARCHAR(100),
        target_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'paused')),
        priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        race_name VARCHAR(200),
        race_distance DECIMAL(10,2),
        race_location VARCHAR(200),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Indexes for goals
    await client.query(`CREATE INDEX IF NOT EXISTS idx_goals_athlete_id ON goals(athlete_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_goals_coach_id ON goals(coach_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date)`);

    // Table: training_plans (NEW for Sprint 3)
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_plans (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coach_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        plan_type VARCHAR(50) CHECK (plan_type IN ('marathon', 'half_marathon', '10km', '5km', 'base_building', 'custom')),
        weeks_total INTEGER NOT NULL,
        weeks_completed INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
        weekly_volume_progression TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for training_plans
    await client.query(`CREATE INDEX IF NOT EXISTS idx_plans_athlete_id ON training_plans(athlete_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_plans_coach_id ON training_plans(coach_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_plans_goal_id ON training_plans(goal_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_plans_status ON training_plans(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_plans_dates ON training_plans(start_date, end_date)`);

    // Table: athlete_records (Records personnels)
    await client.query(`
      CREATE TABLE IF NOT EXISTS athlete_records (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
        distance_type VARCHAR(20) NOT NULL CHECK (distance_type IN ('5km', '10km', 'half_marathon', 'marathon', 'custom')),
        distance_km DECIMAL(10,3),
        time_seconds INT NOT NULL,
        pace VARCHAR(10),
        location VARCHAR(200),
        race_name VARCHAR(200),
        date_achieved DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for athlete_records
    await client.query(`CREATE INDEX IF NOT EXISTS idx_records_athlete_id ON athlete_records(athlete_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_records_distance_type ON athlete_records(distance_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_records_date ON athlete_records(date_achieved DESC)`);

    // Table: races (Courses à venir)
    await client.query(`
      CREATE TABLE IF NOT EXISTS races (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        location VARCHAR(200),
        date DATE NOT NULL,
        distance_km DECIMAL(10,2) NOT NULL,
        distance_label VARCHAR(50),
        elevation_gain INT,
        target_time VARCHAR(10),
        registration_status VARCHAR(20) DEFAULT 'registered' CHECK (registration_status IN ('registered', 'confirmed', 'cancelled', 'completed')),
        race_url VARCHAR(500),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for races
    await client.query(`CREATE INDEX IF NOT EXISTS idx_races_athlete_id ON races(athlete_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_races_date ON races(date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_races_status ON races(registration_status)`);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}
