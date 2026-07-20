-- TAVA Impro — schema de votación (actualizado: rondas + RLS desactivado)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Sesión TAVA',
  is_open BOOLEAN NOT NULL DEFAULT false,
  show_results BOOLEAN NOT NULL DEFAULT false,
  current_round INT NOT NULL DEFAULT 1,
  object_collection_open BOOLEAN NOT NULL DEFAULT false,
  selected_objects TEXT[] NOT NULL DEFAULT '{}',
  admin_pin_hash TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#F87171',
  avatar_gender TEXT NOT NULL DEFAULT 'male',
  tagline TEXT NOT NULL DEFAULT 'El mas chistoso',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  value INT NOT NULL CHECK (value >= 1 AND value <= 5),
  round INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, voter_id, artist_id, round)
);

CREATE INDEX IF NOT EXISTS idx_artists_session ON artists(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_artist ON votes(artist_id);
CREATE INDEX IF NOT EXISTS idx_votes_round ON votes(session_id, round);

CREATE TABLE IF NOT EXISTS round_object_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  object_name TEXT NOT NULL,
  round INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, voter_id, object_name, round)
);

CREATE INDEX IF NOT EXISTS idx_round_objects_session_round
  ON round_object_submissions(session_id, round);

-- Migración si ya tenías tablas sin round:
-- ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS current_round INT NOT NULL DEFAULT 1;
-- ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS object_collection_open BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS selected_objects TEXT[] NOT NULL DEFAULT '{}';
-- ALTER TABLE artists ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#F87171';
-- ALTER TABLE artists ADD COLUMN IF NOT EXISTS avatar_gender TEXT NOT NULL DEFAULT 'male';
-- ALTER TABLE artists ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT 'El mas chistoso';
-- ALTER TABLE votes ADD COLUMN IF NOT EXISTS round INT NOT NULL DEFAULT 1;
-- ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_session_id_voter_id_artist_id_key;
-- ALTER TABLE votes ADD CONSTRAINT votes_session_voter_artist_round_key UNIQUE (session_id, voter_id, artist_id, round);

ALTER TABLE voting_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE artists DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE round_object_submissions DISABLE ROW LEVEL SECURITY;
