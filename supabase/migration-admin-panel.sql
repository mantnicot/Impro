-- Migración: panel admin (mensaje participantes, juegos del día, ruleta)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS participant_message TEXT NOT NULL DEFAULT '';
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS daily_games JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS roulette_candidates TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS roulette_spun_at TIMESTAMPTZ;
