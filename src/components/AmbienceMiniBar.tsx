"use client";

import { motion } from "framer-motion";
import { useAmbienceContext } from "@/context/AmbienceContext";
import { genreTheme } from "@/lib/ambience-genres";

interface AmbienceMiniBarProps {
  /** Ocultar cuando ya estás en la pestaña de ambientes */
  hidden?: boolean;
}

export function AmbienceMiniBar({ hidden = false }: AmbienceMiniBarProps) {
  const { playing, activeGenre, pause, stop } = useAmbienceContext();

  if (hidden || !playing || !activeGenre) return null;

  const theme = genreTheme(activeGenre.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed left-3 right-[5.5rem] z-[55] mx-auto max-w-md rounded-xl border border-tava-purple/30 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:left-auto sm:right-24 sm:max-w-xs"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{activeGenre.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-gray-800">{activeGenre.label}</p>
          <p className="text-[10px] text-gray-500">Ambiente sonando</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={pause}
            className="rounded-lg bg-tava-purple/10 px-2 py-1 text-xs font-bold text-tava-purple"
          >
            ⏸
          </button>
          <button
            type="button"
            onClick={stop}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600"
          >
            ⏹
          </button>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-20"
        style={{ boxShadow: `inset 0 0 24px ${theme.glow}` }}
      />
    </motion.div>
  );
}
