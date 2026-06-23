-- Migración: rondas de votación acumulativas
-- Ejecutar en Supabase SQL Editor si ya creaste las tablas antes

ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS current_round INT NOT NULL DEFAULT 1;

ALTER TABLE votes ADD COLUMN IF NOT EXISTS round INT NOT NULL DEFAULT 1;

ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_session_id_voter_id_artist_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_session_voter_artist_round_key'
  ) THEN
    ALTER TABLE votes
      ADD CONSTRAINT votes_session_voter_artist_round_key
      UNIQUE (session_id, voter_id, artist_id, round);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_votes_round ON votes(session_id, round);

ALTER TABLE voting_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE artists DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
