"use client";

import { motion } from "framer-motion";
import type { ArtistResult } from "@/lib/voting/types";

interface VotingResultsProps {
  results: ArtistResult[];
  title?: string;
  reveal?: boolean;
  podium?: boolean;
}

const medals = ["1", "2", "3"];

function Podium({ results }: { results: ArtistResult[] }) {
  const top = results.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section className="relative mb-5 overflow-hidden rounded-3xl border border-amber-300 bg-gradient-to-b from-[#220b3a] via-[#5b164f] to-[#12071f] p-5 text-white shadow-2xl">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-28 -translate-x-1/2 rotate-6 bg-amber-200/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-4 h-52 w-24 -rotate-12 bg-pink-300/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 right-4 h-52 w-24 rotate-12 bg-purple-300/25 blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-200">
          Ganadores de la noche
        </p>
        <h3 className="mt-1 font-display text-2xl font-black">Podio TAVA</h3>
      </motion.div>

      <div className="relative mt-5 grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
        {top.map((r, index) => {
          const first = index === 0;
          return (
            <motion.div
              key={r.artist.id}
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.18, type: "spring", stiffness: 130 }}
              className={`rounded-2xl border p-4 text-center shadow-xl ${
                first
                  ? "order-first border-amber-200 bg-amber-300 text-purple-950 sm:order-none sm:min-h-[11rem]"
                  : "border-white/20 bg-white/12 sm:min-h-[9rem]"
              }`}
            >
              <div
                className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full font-display text-xl font-black ${
                  first ? "bg-purple-950 text-amber-200" : "bg-white text-purple-900"
                }`}
              >
                {medals[index]}
              </div>
              <p className="mt-3 font-display text-lg font-black leading-tight">{r.artist.name}</p>
              <p className={`mt-1 text-xs ${first ? "text-purple-900" : "text-white/70"}`}>
                {r.voteCount} votos · promedio {r.average.toFixed(1)}
              </p>
              <p className="mt-2 font-display text-3xl font-black">{r.totalPoints}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export function VotingResults({ results, title, reveal, podium = false }: VotingResultsProps) {
  if (results.length === 0) {
    return <p className="text-center text-sm text-gray-500">Sin votos aun</p>;
  }

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-center font-display text-lg font-bold text-tava-purple">{title}</h3>
      )}

      {podium && <Podium results={results} />}

      {results.map((r, i) => (
        <motion.div
          key={r.artist.id}
          initial={reveal ? { opacity: 0, x: -20 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: reveal ? i * 0.12 : 0 }}
          className={`flex items-center gap-3 rounded-2xl border p-4 ${
            i === 0 ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tava-purple font-display text-sm font-black text-white">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display font-bold text-gray-800">{r.artist.name}</p>
            <p className="text-xs text-gray-500">
              {r.voteCount} voto{r.voteCount !== 1 ? "s" : ""} · Promedio {r.average.toFixed(1)}
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
