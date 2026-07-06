"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AmbienceGenreEditor } from "@/components/AmbienceGenreEditor";
import { useAmbienceContext } from "@/context/AmbienceContext";
import { getAmbienceGenres } from "@/lib/ambience-genre-storage";
import { genreTheme } from "@/lib/ambience-genres";
import { unlockAudio } from "@/lib/sounds";

export function AmbienceMiniBar() {
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
  } = useAmbienceContext();
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [genres, setGenres] = useState(() => getAmbienceGenres());
  const [switchingLabel, setSwitchingLabel] = useState<string | null>(null);

  useEffect(() => {
    setGenres(getAmbienceGenres());
  }, []);

  const selectGenre = useCallback(
    async (genre: (typeof genres)[0]) => {
      setSwitchingLabel(genre.label);
      try {
        void unlockAudio();
        stop();
        await playGenre(genre);
      } finally {
        setSwitchingLabel(null);
      }
    },
    [playGenre, stop]
  );

  const theme = activeGenre ? genreTheme(activeGenre.id) : null;
  const showLoader = loading || !!switchingLabel;

  return (
    <>
      <AnimatePresence>
        {showLoader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-white/80 px-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="w-full max-w-sm rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-2xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                className="mx-auto h-14 w-14 rounded-full border-4 border-amber-200 border-t-rose-300"
              />
              <p className="mt-4 font-display text-xl font-black text-gray-800">
                Preparando musica
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {switchingLabel ? `Cargando ${switchingLabel}` : "Activando audio de fondo"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed left-3 right-3 z-[55] mx-auto max-w-md rounded-2xl border border-amber-200 bg-white/95 shadow-lg backdrop-blur-md bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:left-auto sm:right-5 sm:max-w-sm"
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xs font-black uppercase text-amber-800">
            Mus
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-black uppercase tracking-wide text-gray-800">
              Musica de fondo
            </p>
            <p className="truncate text-[11px] text-gray-500">
              {activeGenre ? `${activeGenre.label}${playing ? " sonando" : " listo"}` : "Elige un genero"}
            </p>
          </div>
          <span className="text-xs font-bold text-tava-purple">{open ? "Cerrar" : "Abrir"}</span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-amber-100"
            >
              <div className="p-3">
                {needsUnlock && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void unlockPlayer()}
                    className="mb-3 w-full rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Activar audio
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {genres.slice(0, 6).map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => void selectGenre(genre)}
                      className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                        activeGenre?.id === genre.id
                          ? "border-amber-400 bg-amber-50 text-amber-900"
                          : "border-gray-200 bg-white text-gray-600 hover:border-amber-300"
                      }`}
                    >
                      {genre.label}
                    </button>
                  ))}
                </div>

                {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!activeGenre}
                    onClick={() => (playing ? pause() : toggle())}
                    className="rounded-xl bg-tava-purple px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                  >
                    {playing ? "Pausa" : "Play"}
                  </button>
                  <button
                    type="button"
                    disabled={!activeGenre}
                    onClick={stop}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 disabled:opacity-40"
                  >
                    Stop
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className="ml-auto rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800"
                  >
                    Editar
                  </button>
                </div>

                <label className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span>Volumen</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span>{Math.round(volume * 100)}%</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {theme && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-20"
            style={{ boxShadow: `inset 0 0 24px ${theme.glow}` }}
          />
        )}
      </motion.div>

      <AmbienceGenreEditor
        open={editorOpen}
        genres={genres}
        onClose={() => setEditorOpen(false)}
        onSave={(updated) => setGenres(updated)}
      />
    </>
  );
}
