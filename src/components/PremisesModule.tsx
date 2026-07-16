"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PREMISES } from "@/lib/funny-premises";

function shuffledCopy(items: string[], avoidFirst?: string): string[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  if (avoidFirst && pool.length > 1 && pool[0] === avoidFirst) {
    const swapIndex = pool.findIndex((item) => item !== avoidFirst);
    if (swapIndex > 0) [pool[0], pool[swapIndex]] = [pool[swapIndex]!, pool[0]!];
  }
  return pool;
}

export function PremisesModule() {
  const [state, setState] = useState(() => ({
    deck: shuffledCopy(PREMISES),
    index: 0,
  }));

  const { deck, index } = state;
  const premise = deck[index] ?? "Toca para generar una premisa";

  const nextPremise = useCallback(() => {
    setState((current) => {
      if (current.index < current.deck.length - 1) {
        return { ...current, index: current.index + 1 };
      }
      return {
        deck: shuffledCopy(PREMISES, current.deck[current.index]),
        index: 0,
      };
    });
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-4">
      <div className="mb-4 w-full max-w-md rounded-2xl border border-red-200 bg-white/90 p-3 text-center shadow-sm">
        <p className="font-display text-sm font-black uppercase tracking-widest text-red-700">
          Premisas rapidas
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Mazo unico sin categorias. Se baraja para evitar repeticiones seguidas.
        </p>
        <p className="mt-2 text-xs font-bold text-tava-purple">
          {Math.min(index + 1, deck.length)} / {deck.length}
        </p>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={nextPremise}
        className="relative w-full max-w-md min-h-[16rem] rounded-3xl border-4 border-red-900 bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-8 text-left shadow-[0_12px_40px_rgba(220,38,38,0.45)] transition hover:from-red-400 hover:via-red-500 hover:to-red-600"
      >
        <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] bg-gradient-to-t from-black/20 to-white/10" />
        <div className="relative flex min-h-[12rem] flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={premise}
              initial={{ opacity: 0, y: 12, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -12, rotateX: 8 }}
              transition={{ duration: 0.25 }}
              className="font-display text-xl font-bold leading-snug text-white drop-shadow-md sm:text-2xl"
            >
              {premise}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="relative mt-4 text-center text-xs font-semibold uppercase tracking-widest text-white/80">
          Toca para otra premisa
        </p>
      </motion.button>
    </div>
  );
}
