"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  parseYoutubeVideoId,
  DEFAULT_AMBIENCE_GENRES,
  type AmbienceGenre,
} from "@/lib/ambience-genres";
import { resetAmbienceGenres, saveAmbienceGenres } from "@/lib/ambience-genre-storage";

interface AmbienceGenreEditorProps {
  open: boolean;
  genres: AmbienceGenre[];
  onClose: () => void;
  onSave: (genres: AmbienceGenre[]) => void;
}

export function AmbienceGenreEditor({ open, genres, onClose, onSave }: AmbienceGenreEditorProps) {
  const [draft, setDraft] = useState<AmbienceGenre[]>(genres);

  useEffect(() => {
    if (open) setDraft(genres);
  }, [open, genres]);

  const updateRow = (id: string, patch: Partial<AmbienceGenre>) => {
    setDraft((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addGenre = () => {
    setDraft((rows) => [
      ...rows,
      {
        id: `genre-${crypto.randomUUID().slice(0, 8)}`,
        label: "Nuevo género",
        emoji: "🎵",
        youtubeUrl: "",
      },
    ]);
  };

  const removeGenre = (id: string) => {
    setDraft((rows) => rows.filter((r) => r.id !== id));
  };

  const handleSave = () => {
    const cleaned = draft
      .map((g) => ({
        ...g,
        label: g.label.trim() || "Sin nombre",
        youtubeUrl: g.youtubeUrl.trim(),
      }))
      .filter((g) => g.youtubeUrl);
    saveAmbienceGenres(cleaned);
    onSave(cleaned);
    onClose();
  };

  const handleReset = () => {
    const defaults = resetAmbienceGenres();
    setDraft(defaults);
    onSave(defaults);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t-2 border-tava-purple/30 bg-white p-5 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-200" />
            <h3 className="font-display text-xl font-bold text-tava-purple">Editar géneros y enlaces</h3>
            <p className="mt-1 text-sm text-gray-500">
              Pega el enlace completo de YouTube. Puedes agregar o quitar categorías. Al guardar,
              &quot;Restaurar lista original&quot; usa los 15 enlaces del repositorio.
            </p>

            <div className="mt-4 space-y-3">
              {draft.map((genre) => {
                const valid = !!parseYoutubeVideoId(genre.youtubeUrl);
                return (
                  <div
                    key={genre.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={genre.emoji}
                        onChange={(e) => updateRow(genre.id, { emoji: e.target.value })}
                        className="w-12 rounded-lg border border-gray-200 bg-white px-1 py-2 text-center text-lg"
                        maxLength={4}
                        aria-label="Emoji"
                      />
                      <input
                        type="text"
                        value={genre.label}
                        onChange={(e) => updateRow(genre.id, { label: e.target.value })}
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
                        placeholder="Nombre del género"
                      />
                      <button
                        type="button"
                        onClick={() => removeGenre(genre.id)}
                        className="rounded-lg px-2 text-red-500 hover:bg-red-50"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="url"
                      value={genre.youtubeUrl}
                      onChange={(e) => updateRow(genre.id, { youtubeUrl: e.target.value })}
                      className={`mt-2 w-full rounded-lg border bg-white px-3 py-2 text-xs ${
                        genre.youtubeUrl && !valid
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {genre.youtubeUrl && !valid && (
                      <p className="mt-1 text-xs text-red-500">Enlace no válido</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addGenre}
              className="mt-3 w-full rounded-xl border-2 border-dashed border-tava-purple/40 py-3 text-sm font-medium text-tava-purple"
            >
              + Agregar categoría
            </button>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-xl bg-tava-purple py-3 font-bold text-white"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-600"
              >
                Restaurar lista original ({DEFAULT_AMBIENCE_GENRES.length})
              </button>
            </div>

            <button type="button" onClick={onClose} className="mx-auto mt-4 block text-sm text-gray-400">
              Cerrar
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
