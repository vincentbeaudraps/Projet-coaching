-- Table pour stocker les connexions aux plateformes
CREATE TABLE IF NOT EXISTS connected_platforms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'garmin', 'strava', 'suunto', 'coros', 'polar', 'decathlon'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  scope TEXT, -- Permissions accordées
  athlete_platform_id VARCHAR(255), -- ID de l'athlète sur la plateforme
  connected_at TIMESTAMP DEFAULT NOW(),
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB, -- Infos supplémentaires (nom sur la plateforme, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(athlete_id, platform)
);

-- Table pour logger les synchronisations
CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  connection_id TEXT REFERENCES connected_platforms(id) ON DELETE CASCADE,
  sync_type VARCHAR(50), -- 'push_workout', 'fetch_activities', 'auto_sync'
  status VARCHAR(50), -- 'success', 'failed', 'partial'
  items_synced INTEGER DEFAULT 0,
  error_message TEXT,
  sync_started_at TIMESTAMP DEFAULT NOW(),
  sync_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_connected_platforms_athlete ON connected_platforms(athlete_id);
CREATE INDEX idx_connected_platforms_platform ON connected_platforms(platform);
CREATE INDEX idx_sync_logs_connection ON sync_logs(connection_id);
CREATE INDEX idx_sync_logs_created ON sync_logs(created_at DESC);

-- Ajout d'une colonne pour la sync auto dans la table athletes
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true;
