"use client";

import { motion } from "framer-motion";
import type { WordList } from "@/types";
import { removeFromFavorites } from "@/lib/storage";

interface FavoritesPanelProps {
  favorites: WordList | undefined;
  onRefresh: () => void;
  onClose: () => void;
  onPlay: () => void;
}

export function FavoritesPanel({ favorites, onRefresh, onClose, onPlay }: FavoritesPanelProps) {
  const words = favorites?.words ?? [];

  const handleRemove = async (word: string) => {
    await removeFromFavorites(word);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t-2 border-pink-200 bg-white p-6 sm:max-w-lg sm:rounded-2xl sm:border sm:shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-tava-neon-pink">★ Favoritos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {words.length > 0 && (
          <button
            onClick={onPlay}
            className="mb-4 w-full rounded-xl bg-pink-50 py-2 text-sm font-medium text-tava-neon-pink hover:bg-pink-100"
          >
            ▶ Jugar con Favoritos
          </button>
        )}

        <div className="space-y-2">
          {words.length === 0 && (
            <p className="py-8 text-center text-gray-400">
              Desliza ↑ durante el juego para agregar favoritos
            </p>
          )}
          {words.map((word) => (
            <div
              key={word}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <span className="text-gray-800">{word}</span>
              <button
                onClick={() => handleRemove(word)}
                className="text-sm text-red-400 hover:text-red-500"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
