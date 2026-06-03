"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAmbiencePlayer } from "@/hooks/useAmbiencePlayer";
import { YoutubeAmbienceHost } from "@/components/YoutubeAmbienceHost";
import { AmbienceGenreEditor } from "@/components/AmbienceGenreEditor";
import { genreTheme, type AmbienceGenre } from "@/lib/ambience-genres";
import { getAmbienceGenres } from "@/lib/ambience-genre-storage";
import { unlockAudio } from "@/lib/sounds";

export function AmbienceModule() {
  const {
    volume,
    setVolume,
    playing,
    activeGenre,
    error,
    loading,
    needsUnlock,
    unlockPlayer,
    playGenre,
    pause,
    stop,
    toggle,
  } = useAmbiencePlayer();
  const [genres, setGenres] = useState<AmbienceGenre[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    setGenres(getAmbienceGenres());
  }, []);

  const selectGenre = useCallback(
    async (genre: AmbienceGenre) => {
      void unlockAudio();
      stop();
      await playGenre(genre);
    },
    [playGenre, stop]
  );

  const theme = activeGenre ? genreTheme(activeGenre.id) : null;
  const isDark = theme?.isDark ?? false;

  return (
    <div
      className={`relative flex flex-1 flex-col overflow-hidden transition-colors duration-500 ${
        theme ? `bg-gradient-to-b ${theme.bg}` : ""
      }`}
    >
      <YoutubeAmbienceHost showVideo={showVideo && playing} />

      {theme && (
        <motion.div
          key={activeGenre?.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ boxShadow: `inset 0 0 120px 40px ${theme.glow}` }}
        />
      )}

      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className={`font-display text-lg font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
              Ambientes por género
            </h2>
            <p className={`mt-0.5 text-xs ${isDark ? "text-white/60" : "text-gray-500"}`}>
              YouTube · solo audio (o activa video de fondo)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="shrink-0 rounded-xl border border-tava-purple/40 bg-white px-3 py-2 text-xs font-bold text-tava-purple shadow-sm"
          >
            ✏️ Editar enlaces
          </button>
        </div>

        <label className={`mt-3 flex items-center gap-2 text-xs ${isDark ? "text-white/80" : "text-gray-600"}`}>
          <input
            type="checkbox"
            checked={showVideo}
            onChange={(e) => setShowVideo(e.target.checked)}
            className="accent-tava-purple"
          />
          Mostrar video de fondo (baja opacidad)
        </label>

        {needsUnlock && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            disabled={loading}
            onClick={() => void unlockPlayer()}
            className="mt-4 w-full rounded-2xl border-2 border-tava-purple bg-tava-purple px-4 py-4 text-center text-sm font-bold text-white shadow-lg disabled:opacity-60"
          >
            {loading ? "Activando…" : "🔊 Activar audio (requerido en móvil)"}
          </motion.button>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {genres.map((genre) => (
            <motion.button
              key={genre.id}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => void selectGenre(genre)}
              className={`rounded-xl border p-3 text-left transition ${
                activeGenre?.id === genre.id
                  ? "border-tava-purple bg-white shadow-lg ring-2 ring-tava-purple/30"
                  : isDark
                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                    : "border-gray-200 bg-white/90 shadow-sm hover:border-tava-purple"
              }`}
            >
              <span className="text-2xl">{genre.emoji}</span>
              <p
                className={`mt-1 text-xs font-bold leading-tight ${
                  isDark && activeGenre?.id !== genre.id ? "text-white" : "text-gray-800"
                }`}
              >
                {genre.label}
              </p>
            </motion.button>
          ))}
        </div>

        {genres.length === 0 && (
          <p className="mt-6 text-center text-sm text-gray-500">
            No hay géneros. Pulsa &quot;Editar enlaces&quot; para agregar uno.
          </p>
        )}

        {(activeGenre || playing) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 rounded-2xl border p-4 ${
              isDark ? "border-red-500/40 bg-black/50 text-white" : "border-tava-purple/20 bg-white shadow-lg"
            }`}
          >
            {activeGenre && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-tava-purple/80">
                  Reproduciendo
                </p>
                <p className="font-display text-xl font-bold">
                  {activeGenre.emoji} {activeGenre.label}
                </p>
              </>
            )}
            {loading && !error && (
              <p className="mt-2 text-xs text-tava-purple/80">Cargando audio…</p>
            )}
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

            <div className="mt-3 flex items-center justify-center gap-2">
              {playing && (
                <div className="mr-2 flex h-8 items-end gap-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full bg-tava-purple"
                      animate={{ height: [8, 20, 8] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => (playing ? pause() : toggle())}
                className="rounded-xl bg-tava-purple px-4 py-2 text-sm font-bold text-white"
              >
                {playing ? "⏸ Pausa" : "▶ Play"}
              </button>
              <button
                type="button"
                onClick={stop}
                className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                  isDark ? "border-white/30" : "border-gray-300"
                }`}
              >
                ⏹ Stop
              </button>
            </div>

            <label className="mt-4 flex items-center gap-2 text-xs">
              <span>Volumen</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-tava-purple"
              />
              <span>{Math.round(volume * 100)}%</span>
            </label>
          </motion.div>
        )}
      </div>

      <AmbienceGenreEditor
        open={editorOpen}
        genres={genres}
        onClose={() => setEditorOpen(false)}
        onSave={(updated) => setGenres(updated)}
      />
    </div>
  );
}
