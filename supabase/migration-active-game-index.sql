-- Índice del juego activo en el proyector / control del show
ALTER TABLE voting_sessions
  ADD COLUMN IF NOT EXISTS active_game_index INT NOT NULL DEFAULT 0;
