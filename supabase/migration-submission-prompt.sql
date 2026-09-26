-- Migración: etiqueta y texto configurable para lo que envía el público
-- Ejecutar en Supabase SQL Editor

ALTER TABLE voting_sessions
  ADD COLUMN IF NOT EXISTS submission_label TEXT NOT NULL DEFAULT 'Objeto';

ALTER TABLE voting_sessions
  ADD COLUMN IF NOT EXISTS submission_prompt TEXT NOT NULL DEFAULT 'Escribe un objeto concreto para el sorteo';
