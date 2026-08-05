"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface WordRouletteProps {
  items: string[];
  winner: string;
  open: boolean;
  onComplete?: () => void;
}

export function WordRoulette({ items, winner, open, onComplete }: WordRouletteProps) {
  const pool = useMemo(() => {
    const unique = [...new Set(items.filter(Boolean))];
    if (unique.length === 0) return winner ? [winner] : [];
    if (!unique.includes(winner) && winner) unique.push(winner);
    return unique;
  }, [items, winner]);

  const [displayWord, setDisplayWord] = useState(winner);
  const [phase, setPhase] = useState<"spinning" | "winner">("spinning");

  useEffect(() => {
    if (!open || pool.length === 0) return;

    setPhase("spinning");
    setDisplayWord(pool[0] ?? winner);

    let tick = 0;
    const maxTicks = Math.max(18, pool.length * 4);
    const interval = window.setInterval(() => {
      tick += 1;
      const index = tick % pool.length;
      setDisplayWord(pool[index]!);

      if (tick >= maxTicks) {
        window.clearInterval(interval);
        setDisplayWord(winner);
        setPhase("winner");
        window.setTimeout(() => onComplete?.(), 1800);
      }
    }, 90 + tick * 6);

    return () => window.clearInterval(interval);
  }, [open, pool, winner, onComplete]);

  if (!open || !winner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-amber-300/60 bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 p-6 text-white shadow-2xl"
        >
          <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-amber-300">
            Ruleta TAVA
          </p>

          <div className="relative mx-auto mt-6 h-56 w-56">
            <motion.div
              animate={{ rotate: phase === "spinning" ? 360 : 0 }}
              transition={
                phase === "spinning"
                  ? { repeat: Infinity, duration: 0.8, ease: "linear" }
                  : { duration: 0.6, type: "spring" }
              }
              className="absolute inset-0 rounded-full border-[10px] border-amber-400/80 bg-gradient-to-br from-tava-purple to-tava-neon-pink shadow-[0_0_40px_rgba(251,191,36,0.35)]"
            />
            <div className="absolute inset-4 rounded-full border border-white/20 bg-black/40" />
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
              <div className="h-0 w-0 border-x-[12px] border-b-[22px] border-x-transparent border-b-amber-300 drop-shadow-lg" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <motion.p
                key={displayWord}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: phase === "winner" ? 1.08 : 1 }}
                className={`font-display text-2xl font-black leading-tight ${
                  phase === "winner" ? "text-amber-300" : "text-white"
                }`}
              >
                {displayWord}
              </motion.p>
            </div>
          </div>

          <motion.p
            animate={{ opacity: phase === "winner" ? 1 : 0.5 }}
            className="mt-5 text-center text-sm text-purple-100"
          >
            {phase === "spinning" ? "Girando..." : "Palabra elegida"}
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
