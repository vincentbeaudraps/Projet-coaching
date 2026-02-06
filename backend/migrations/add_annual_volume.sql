-- Migration: Add annual_volume table for manual volume tracking
-- This allows athletes to manually enter their yearly running volume

CREATE TABLE IF NOT EXISTS annual_volume (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  volume_km DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(athlete_id, year)
);

CREATE INDEX IF NOT EXISTS idx_annual_volume_athlete ON annual_volume(athlete_id);
CREATE INDEX IF NOT EXISTS idx_annual_volume_year ON annual_volume(year);

COMMENT ON TABLE annual_volume IS 'Manual annual volume entries by athletes';
COMMENT ON COLUMN annual_volume.volume_km IS 'Total kilometers run in the year';
