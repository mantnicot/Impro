-- Migración: panel admin (mensaje participantes, juegos del día, ruleta)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS participant_message TEXT NOT NULL DEFAULT '';
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS daily_games JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS roulette_candidates TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS roulette_spun_at TIMESTAMPTZ;

UPDATE voting_sessions
SET participant_message = 'Bienvenido a la Impro
1-) Disfruta
2-) Juego
3-) Sigue el ritmo
4-) Cada vez que comience un conteo debes decir "TAVA"
5-) Si te piden algo hazlo , seguro te divertiras

:D mucha mierda'
WHERE participant_message = '';
