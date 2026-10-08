-- Migración: escena del proyector / videobeam (no afecta celulares)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE voting_sessions
  ADD COLUMN IF NOT EXISTS display_scene TEXT NOT NULL DEFAULT 'lobby';

-- Salas existentes: dejar en lobby hasta que arranque el show
UPDATE voting_sessions
SET display_scene = 'lobby'
WHERE display_scene IS NULL OR display_scene = 'auto';
