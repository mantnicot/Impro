-- Foto temporal del jugador (solo para la noche / sesión).
-- El admin sube PNG sin fondo (recomendado). Se limpia al borrar la sala (CASCADE).

ALTER TABLE artists ADD COLUMN IF NOT EXISTS photo_data TEXT;
