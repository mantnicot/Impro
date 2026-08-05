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
      className={`sticky top-0 z-30 border-b border-amber-200/80 bg-white/95 shadow-sm backdrop-blur ${
        compact ? "px-2 py-2" : "px-3 py-3"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">
          Puntaje acumulado
        </p>
        <p className="text-[10px] font-bold text-gray-400">{results.length} jugadores</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {results.map((result, index) => (
          <motion.div
            key={result.artist.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex min-w-[7.5rem] shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-amber-50 px-3 py-2 shadow-sm"
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
