-- Cierra la sala solo para el publico (celulares). Admin y proyector siguen.
-- Ejecutar en Supabase SQL Editor

ALTER TABLE voting_sessions
  ADD COLUMN IF NOT EXISTS audience_closed_until TIMESTAMPTZ;
