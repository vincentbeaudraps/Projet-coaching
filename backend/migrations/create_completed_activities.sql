-- Migration: Create completed_activities table
-- Description: Table pour stocker les activités complétées par les athlètes
-- Date: 2026-02-06

-- Create completed_activities table
CREATE TABLE IF NOT EXISTS completed_activities (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) DEFAULT 'running',
  title VARCHAR(200),
  date DATE NOT NULL,
  start_date TIMESTAMP,
  duration INTEGER, -- Duration in seconds
  duration_seconds INTEGER, -- Alternative column name (standardized)
  distance DECIMAL(10,3), -- Distance in km
  distance_km DECIMAL(10,3), -- Alternative column name (standardized)
  elevation_gain INTEGER, -- Elevation in meters
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  avg_pace VARCHAR(10), -- Format MM:SS
  avg_speed DECIMAL(5,2), -- Speed in km/h
  calories INTEGER,
  training_zone VARCHAR(20) CHECK (training_zone IN ('recovery', 'endurance', 'tempo', 'threshold', 'vo2max', 'sprint')),
  perceived_effort INTEGER CHECK (perceived_effort >= 1 AND perceived_effort <= 10),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
  feeling_rating INTEGER CHECK (feeling_rating >= 1 AND feeling_rating <= 10),
  athlete_notes TEXT,
  coach_comment TEXT,
  notes TEXT,
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'gpx', 'garmin', 'strava', 'polar', 'suunto', 'coros', 'wahoo')),
  gpx_data TEXT,
  external_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_completed_activities_athlete_id ON completed_activities(athlete_id);
CREATE INDEX IF NOT EXISTS idx_completed_activities_date ON completed_activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_completed_activities_start_date ON completed_activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_completed_activities_activity_type ON completed_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_completed_activities_training_zone ON completed_activities(training_zone);
CREATE INDEX IF NOT EXISTS idx_completed_activities_source ON completed_activities(source);
CREATE INDEX IF NOT EXISTS idx_completed_activities_external_id ON completed_activities(external_id);

-- Standardize duration and distance columns
-- Copy data from old columns to new standardized columns if they exist
DO $$
BEGIN
  -- Ensure duration_seconds has same data as duration
  UPDATE completed_activities 
  SET duration_seconds = duration 
  WHERE duration IS NOT NULL AND duration_seconds IS NULL;
  
  -- Ensure distance_km has same data as distance
  UPDATE completed_activities 
  SET distance_km = distance 
  WHERE distance IS NOT NULL AND distance_km IS NULL;
END $$;

-- Comments for documentation
COMMENT ON TABLE completed_activities IS 'Activités complétées par les athlètes (courses, entraînements)';
COMMENT ON COLUMN completed_activities.duration IS 'Durée en secondes (ancienne colonne, utiliser duration_seconds)';
COMMENT ON COLUMN completed_activities.duration_seconds IS 'Durée en secondes (colonne standardisée)';
COMMENT ON COLUMN completed_activities.distance IS 'Distance en km (ancienne colonne, utiliser distance_km)';
COMMENT ON COLUMN completed_activities.distance_km IS 'Distance en km (colonne standardisée)';
COMMENT ON COLUMN completed_activities.training_zone IS 'Zone d''entraînement de la séance';
COMMENT ON COLUMN completed_activities.perceived_effort IS 'Effort perçu (1-10)';
COMMENT ON COLUMN completed_activities.source IS 'Source de l''activité (manual, gpx, platform sync)';
