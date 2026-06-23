"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  drawRandomPremise,
  PREMISE_CATEGORIES,
  type PremiseCategory,
} from "@/lib/funny-premises";

export function PremisesModule() {
  const [category, setCategory] = useState<PremiseCategory>("all");
  const [premise, setPremise] = useState(() => drawRandomPremise(undefined, "all"));

  const nextPremise = useCallback(() => {
    setPremise((prev) => drawRandomPremise(prev, category));
  }, [category]);

  const changeCategory = (cat: PremiseCategory) => {
    setCategory(cat);
    setPremise(drawRandomPremise(undefined, cat));
  };

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-4">
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {PREMISE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => changeCategory(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              category === c.id
                ? "bg-tava-purple text-white"
                : "border border-gray-200 bg-white text-gray-600"
            }`}
          >
            {c.label}
          </button>
        ))}
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
          Toca para otra premisa →
        </p>
      </motion.button>
    </div>
  );
}
