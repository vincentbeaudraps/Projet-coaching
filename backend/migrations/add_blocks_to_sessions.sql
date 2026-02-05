-- Migration: Add blocks and notes columns to training_sessions table
-- Date: 2026-02-05
-- Description: Support pour le système avancé de création de séances avec blocs d'entraînement

-- SQLite
-- ALTER TABLE training_sessions ADD COLUMN blocks TEXT;
-- ALTER TABLE training_sessions ADD COLUMN notes TEXT;

-- PostgreSQL
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS blocks TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Commentaires
COMMENT ON COLUMN training_sessions.blocks IS 'Structure JSON des blocs d''entraînement (échauffement, travail, récup, etc.)';
COMMENT ON COLUMN training_sessions.notes IS 'Notes générales du coach pour la séance';
