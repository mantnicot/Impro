"use client";

import { motion } from "framer-motion";
import type { ArtistResult } from "@/lib/voting/types";

interface VotingResultsProps {
  results: ArtistResult[];
  title?: string;
  reveal?: boolean;
}

export function VotingResults({ results, title, reveal }: VotingResultsProps) {
  if (results.length === 0) {
    return <p className="text-center text-sm text-gray-500">Sin votos aún</p>;
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-center font-display text-lg font-bold text-tava-purple">{title}</h3>
      )}
      {results.map((r, i) => (
        <motion.div
          key={r.artist.id}
          initial={reveal ? { opacity: 0, x: -20 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: reveal ? i * 0.15 : 0 }}
          className={`flex items-center gap-3 rounded-2xl border p-4 ${
            i === 0
              ? "border-amber-400 bg-amber-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <span className="text-2xl">{i < 3 ? medals[i] : `${i + 1}.`}</span>
          <div className="flex-1">
            <p className="font-display font-bold text-gray-800">{r.artist.name}</p>
            <p className="text-xs text-gray-500">
              {r.voteCount} voto{r.voteCount !== 1 ? "s" : ""} · Promedio {r.average.toFixed(1)} ★
              {r.roundsWithVotes != null && r.roundsWithVotes > 0 && (
                <> · {r.roundsWithVotes} ronda{r.roundsWithVotes !== 1 ? "s" : ""}</>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-black text-tava-purple">{r.totalPoints}</p>
            <p className="text-[10px] uppercase text-gray-400">pts</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
