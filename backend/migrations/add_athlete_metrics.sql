-- Migration: Add athlete metrics columns
-- Description: Add max heart rate, VMA, and other training metrics to athletes table
-- Date: 2024

-- Add metrics columns to athletes table
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS max_heart_rate INT,
ADD COLUMN IF NOT EXISTS vma DECIMAL(4,2), -- VMA in km/h (e.g., 16.50)
ADD COLUMN IF NOT EXISTS resting_heart_rate INT,
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2), -- Weight in kg (e.g., 72.50)
ADD COLUMN IF NOT EXISTS vo2max DECIMAL(5,2), -- VO2max in ml/kg/min
ADD COLUMN IF NOT EXISTS lactate_threshold_pace VARCHAR(10), -- Pace at threshold (e.g., "4:30")
ADD COLUMN IF NOT EXISTS metrics_updated_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN athletes.max_heart_rate IS 'Maximum heart rate in BPM (Beats Per Minute)';
COMMENT ON COLUMN athletes.vma IS 'VMA (Vitesse Maximale Aérobie) in km/h';
COMMENT ON COLUMN athletes.resting_heart_rate IS 'Resting heart rate in BPM';
COMMENT ON COLUMN athletes.weight IS 'Athlete weight in kilograms';
COMMENT ON COLUMN athletes.vo2max IS 'VO2max in ml/kg/min';
COMMENT ON COLUMN athletes.lactate_threshold_pace IS 'Running pace at lactate threshold (format: MM:SS)';
COMMENT ON COLUMN athletes.metrics_updated_at IS 'Last time metrics were updated';

-- Create index for performance queries
CREATE INDEX IF NOT EXISTS idx_athletes_metrics_updated ON athletes(metrics_updated_at);

-- Create a metrics history table for tracking changes over time
CREATE TABLE IF NOT EXISTS athlete_metrics_history (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  max_heart_rate INT,
  vma DECIMAL(4,2),
  resting_heart_rate INT,
  weight DECIMAL(5,2),
  vo2max DECIMAL(5,2),
  lactate_threshold_pace VARCHAR(10),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_metrics_history_athlete ON athlete_metrics_history(athlete_id, recorded_at DESC);

COMMENT ON TABLE athlete_metrics_history IS 'Historical tracking of athlete metrics for progress monitoring';
