-- Migración: escena del proyector / videobeam (no afecta celulares)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE voting_sessions
  ADD COLUMN IF NOT EXISTS display_scene TEXT NOT NULL DEFAULT 'auto';
