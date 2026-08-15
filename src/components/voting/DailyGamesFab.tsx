"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import type { DailyGame } from "@/lib/voting/types";

interface DailyGamesFabProps {
  games: DailyGame[];
}

const POS_KEY = "tava-games-fab-pos";

export function DailyGamesFab({ games }: DailyGamesFabProps) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const dragging = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(POS_KEY);
      if (saved) {
        const pos = JSON.parse(saved) as { x?: number; y?: number };
        x.set(pos.x ?? 0);
        y.set(pos.y ?? 0);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [x, y]);

  if (games.length === 0) return null;

  return (
    <>
      {ready && (
        <motion.button
          type="button"
          drag
          dragMomentum={false}
          dragElastic={0.12}
          dragConstraints={{
            left: -window.innerWidth + 72,
            right: 16,
            top: -16,
            bottom: window.innerHeight - 96,
          }}
          style={{ x, y }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileDrag={{ scale: 1.08, cursor: "grabbing" }}
          onDragStart={() => {
            dragging.current = true;
          }}
          onDragEnd={() => {
            localStorage.setItem(POS_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
            window.setTimeout(() => {
              dragging.current = false;
            }, 80);
          }}
          onClick={() => {
            if (!dragging.current) setOpen(true);
          }}
          className="fixed right-3 top-[calc(3.25rem+env(safe-area-inset-top,0px))] z-40 flex h-12 w-12 touch-none cursor-grab items-center justify-center rounded-full bg-gradient-to-br from-tava-purple to-tava-neon-pink text-xl text-white shadow-[0_8px_24px_rgba(124,58,237,0.45)] sm:right-4 sm:h-14 sm:w-14 sm:text-2xl"
          aria-label="Ver juegos del dia. Arrastra para mover."
        >
          🎮
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[85dvh] w-full max-w-lg overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-2xl"
            >
              <div className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-tava-purple">
                      Juegos del dia
                    </p>
                    <h3 className="font-display text-lg font-black text-gray-900 sm:text-xl">
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

              <div className="max-h-[65dvh] space-y-3 overflow-y-auto p-3 sm:p-4">
                {games.map((game, index) => (
                  <motion.article
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tava-purple/10 font-display text-sm font-black text-tava-purple sm:h-9 sm:w-9">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-display text-base font-black text-gray-900 sm:text-lg">{game.name}</h4>
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
