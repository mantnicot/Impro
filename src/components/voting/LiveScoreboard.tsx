"use client";

import { motion } from "framer-motion";
import type { ArtistResult } from "@/lib/voting/types";

interface LiveScoreboardProps {
  results: ArtistResult[];
  compact?: boolean;
}

export function LiveScoreboard({ results, compact = false }: LiveScoreboardProps) {
  if (results.length === 0) return null;

  return (
    <section
      className={`shrink-0 border-b border-amber-200/80 bg-white/95 shadow-sm backdrop-blur ${
        compact ? "px-2 py-1.5" : "px-3 py-2.5"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700 sm:text-[10px] sm:tracking-[0.25em]">
          Puntaje acumulado
        </p>
        <p className="text-[9px] font-bold text-gray-400 sm:text-[10px]">{results.length} jugadores</p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden">
        {results.map((result, index) => (
          <motion.div
            key={result.artist.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex min-w-[6.75rem] shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-amber-50 px-2 py-1.5 shadow-sm sm:min-w-[7.5rem] sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
              style={{ backgroundColor: result.artist.color }}
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-gray-800">{result.artist.name}</p>
              <p className="font-display text-lg font-black leading-none text-amber-700">
                {result.totalPoints}
                <span className="ml-1 text-[10px] font-bold uppercase text-gray-400">pts</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
