"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface WordRouletteProps {
  items: string[];
  winner: string;
  open: boolean;
  label?: string;
  onComplete?: () => void;
}

const SEGMENTS = ["#D61A21", "#FFC600", "#1A3A82", "#FFC600", "#D61A21", "#1A3A82"];

export function WordRoulette({ items, winner, open, label = "Propuesta", onComplete }: WordRouletteProps) {
  const pool = useMemo(() => {
    const unique = [...new Set(items.filter(Boolean))];
    if (unique.length === 0) return winner ? [winner] : [];
    if (!unique.includes(winner) && winner) unique.push(winner);
    // Rellenar para que la ruleta se vea siempre colorida
    while (unique.length < 6) {
      unique.push(...unique.slice(0, Math.min(unique.length, 6 - unique.length)));
    }
    return unique;
  }, [items, winner]);

  const [displayWord, setDisplayWord] = useState(winner);
  const [phase, setPhase] = useState<"spinning" | "winner">("spinning");
  const [flashColor, setFlashColor] = useState(SEGMENTS[0]!);

  const wheelBackground = useMemo(() => {
    const slice = 100 / SEGMENTS.length;
    return `conic-gradient(${SEGMENTS.map((color, i) => `${color} ${i * slice}% ${(i + 1) * slice}%`).join(", ")})`;
  }, []);

  useEffect(() => {
    if (!open || pool.length === 0) return;

    setPhase("spinning");
    setDisplayWord(pool[0] ?? winner);

    let tick = 0;
    const maxTicks = Math.min(14, Math.max(8, pool.length + 4));
    const interval = window.setInterval(() => {
      tick += 1;
      const index = tick % pool.length;
      setDisplayWord(pool[index]!);
      setFlashColor(SEGMENTS[tick % SEGMENTS.length]!);

      if (tick >= maxTicks) {
        window.clearInterval(interval);
        setDisplayWord(winner);
        setFlashColor("#FFC600");
        setPhase("winner");
        window.setTimeout(() => onComplete?.(), 700);
      }
    }, 45);

    return () => window.clearInterval(interval);
  }, [open, pool, winner, onComplete]);

  if (!open || !winner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-tava-blue/80 px-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.86, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-md overflow-hidden rounded-3xl border-4 border-tava-yellow bg-tava-blue p-5 text-white shadow-[10px_10px_0_rgba(11,18,32,0.45)]"
        >
          <div className="text-center">
            <p className="font-display text-3xl tracking-wide text-tava-yellow">RULETA</p>
            <p className="-mt-1 font-hand text-xl text-white">#TAVA en el acto</p>
          </div>

          <div className="relative mx-auto mt-5 h-64 w-64">
            <motion.div
              animate={{ rotate: phase === "spinning" ? 720 : 18 }}
              transition={
                phase === "spinning"
                  ? { repeat: Infinity, duration: 0.35, ease: "linear" }
                  : { type: "spring", stiffness: 180, damping: 16 }
              }
              className="absolute inset-0 rounded-full border-8 border-white shadow-[0_0_40px_rgba(255,198,0,0.55)]"
              style={{ background: wheelBackground }}
            />
            <div className="absolute inset-8 rounded-full border-4 border-white/80 bg-tava-blue/90 shadow-inner" />
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
              <div className="h-0 w-0 border-x-[14px] border-b-[26px] border-x-transparent border-b-tava-yellow drop-shadow-lg" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center sm:p-10">
              <motion.p
                key={displayWord + phase}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: phase === "winner" ? 1.08 : 1 }}
                className={`font-display leading-tight tracking-wide ${
                  displayWord.length > 28 ? "text-lg sm:text-xl" : displayWord.length > 16 ? "text-2xl" : "text-3xl"
                }`}
                style={{ color: phase === "winner" ? "#FFC600" : flashColor }}
              >
                {displayWord}
              </motion.p>
            </div>
          </div>

          <motion.p
            animate={{ opacity: 1 }}
            className="mt-4 text-center font-hand text-2xl text-tava-yellow"
          >
            {phase === "spinning" ? "¡Girando a toda!" : `¡${label} elegido!`}
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
