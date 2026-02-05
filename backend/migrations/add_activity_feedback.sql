-- Migration: Ajout de champs feedback/notes pour les activités
-- Date: 5 février 2026

-- Ajouter les colonnes de feedback aux activités
ALTER TABLE completed_activities 
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
ADD COLUMN IF NOT EXISTS feeling_rating INTEGER CHECK (feeling_rating >= 1 AND feeling_rating <= 10),
ADD COLUMN IF NOT EXISTS athlete_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Créer un index sur updated_at pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_completed_activities_updated_at ON completed_activities(updated_at DESC);

-- Commentaires sur les colonnes
COMMENT ON COLUMN completed_activities.difficulty_rating IS 'Note de difficulté ressentie (1=très facile, 10=très difficile)';
COMMENT ON COLUMN completed_activities.feeling_rating IS 'Note de sensations/forme (1=très mauvais, 10=excellent)';
COMMENT ON COLUMN completed_activities.athlete_notes IS 'Notes/commentaires de l''athlète sur la séance';
COMMENT ON COLUMN completed_activities.updated_at IS 'Date de dernière modification';
