"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRandomPremise, PREMISE_CATEGORIES } from "@/lib/funny-premises";

export function PremisesModule() {
  const [draws, setDraws] = useState<Record<string, string>>({});
  const [flipped, setFlipped] = useState<string | null>(null);

  const drawPremise = useCallback((categoryId: string) => {
    setDraws((prev) => {
      const next = getRandomPremise(categoryId, prev[categoryId]);
      return { ...prev, [categoryId]: next };
    });
    setFlipped(categoryId);
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
      <p className="mb-4 text-center text-xs text-gray-500">
        Toca una tarjeta para sacar una premisa chistosa al azar
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {PREMISE_CATEGORIES.map((cat) => {
          const premise = draws[cat.id];
          const isFlipped = flipped === cat.id && !!premise;

          return (
            <motion.button
              key={cat.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => drawPremise(cat.id)}
              className="group relative min-h-[11rem] text-left perspective-[800px]"
            >
              <div
                className={`relative h-full min-h-[11rem] transition-transform duration-500 [transform-style:preserve-3d] ${
                  isFlipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* Frente */}
                <div
                  className={`absolute inset-0 flex flex-col rounded-2xl border-2 border-white/60 bg-gradient-to-br ${cat.accent} p-4 shadow-lg [backface-visibility:hidden]`}
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <p className="mt-2 font-display text-sm font-bold leading-snug text-white drop-shadow">
                    {cat.title}
                  </p>
                  <p className="mt-auto text-[10px] font-medium uppercase tracking-wider text-white/70">
                    Toca para generar →
                  </p>
                  <div className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10" />
                </div>

                {/* Dorso con premisa */}
                <div className="absolute inset-0 flex flex-col rounded-2xl border-2 border-tava-purple/30 bg-white p-4 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-tava-purple/70">
                    {cat.emoji} Premisa
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={premise ?? "empty"}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex-1 font-display text-base font-bold leading-snug text-gray-800"
                    >
                      {premise ?? "…"}
                    </motion.p>
                  </AnimatePresence>
                  <p className="mt-2 text-[10px] text-gray-400">Toca otra vez para otra premisa</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
