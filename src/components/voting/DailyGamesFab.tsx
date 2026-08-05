"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DailyGame } from "@/lib/voting/types";

interface DailyGamesFabProps {
  games: DailyGame[];
}

export function DailyGamesFab({ games }: DailyGamesFabProps) {
  const [open, setOpen] = useState(false);

  if (games.length === 0) return null;

  return (
    <>
      <motion.button
        type="button"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-tava-purple to-tava-neon-pink text-2xl text-white shadow-[0_10px_30px_rgba(124,58,237,0.45)]"
        aria-label="Ver juegos del dia"
      >
        🎮
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[80dvh] w-full max-w-lg overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-2xl"
            >
              <div className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-tava-purple">
                      Juegos del dia
                    </p>
                    <h3 className="font-display text-xl font-black text-gray-900">
                      {games.length} actividad{games.length !== 1 ? "es" : ""}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-white px-3 py-1 text-sm font-bold text-gray-500 shadow"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="max-h-[60dvh] space-y-3 overflow-y-auto p-4">
                {games.map((game, index) => (
                  <motion.article
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tava-purple/10 font-display text-sm font-black text-tava-purple">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-display text-lg font-black text-gray-900">{game.name}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{game.description}</p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
