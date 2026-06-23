"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { clearSession, getSessionCode, getVoterId } from "@/lib/role-storage";
import type { Artist, ArtistResult, VotingSession } from "@/lib/voting/types";
import { VotingResults } from "./VotingResults";

export function VotingParticipantView() {
  const code = getSessionCode();
  const voterId = getVoterId();
  const [session, setSession] = useState<VotingSession | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [results, setResults] = useState<ArtistResult[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/voting/session?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data.session);
      setArtists(data.artists ?? []);
      if (data.results) setResults(data.results);

      if (data.session?.id) {
        const round = data.session.current_round ?? 1;
        const vRes = await fetch(
          `/api/voting/vote?sessionId=${data.session.id}&voterId=${encodeURIComponent(voterId)}&round=${round}`
        );
        if (vRes.ok) {
          const vData = await vRes.json();
          const map: Record<string, number> = {};
          for (const v of vData.votes ?? []) map[v.artist_id] = v.value;
          setVotes(map);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, [code, voterId]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [refresh]);

  const submitVote = async (artistId: string, value: number) => {
    if (!session?.is_open) return;
    setVotes((prev) => ({ ...prev, [artistId]: value }));
    setSaved(false);
    const res = await fetch("/api/voting/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, artistId, voterId, value }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (session?.show_results && results) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-8">
        <h2 className="text-center font-display text-2xl font-black text-tava-purple">
          🏆 Resultados finales
        </h2>
        <p className="mt-1 text-center text-sm text-gray-500">{session.title}</p>
        <p className="mt-1 text-center text-xs text-gray-400">Puntos acumulados de todas las rondas</p>
        <div className="mt-6">
          <VotingResults results={results} reveal />
        </div>
      </div>
    );
  }

  const round = session?.current_round ?? 1;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-8">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Sala {code}</p>
        <h2 className="font-display text-xl font-bold text-gray-800">{session?.title ?? "Votación TAVA"}</h2>
        <p className="mt-1 text-xs font-semibold text-tava-purple">Ronda {round}</p>
        <p
          className={`mt-2 inline-block rounded-full px-4 py-1 text-xs font-bold ${
            session?.is_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {session?.is_open ? "Puedes votar en esta ronda" : "Votación cerrada — espera la siguiente ronda"}
        </p>
      </div>

      {saved && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-center text-sm font-bold text-green-600"
        >
          ✓ Voto guardado (ronda {round})
        </motion.p>
      )}

      <div className="mt-6 space-y-4">
        {artists.map((artist) => (
          <div key={artist.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="font-display text-lg font-bold text-gray-800">{artist.name}</p>
            <div className="mt-3 flex justify-between gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={!session?.is_open}
                  onClick={() => void submitVote(artist.id, n)}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${
                    votes[artist.id] === n
                      ? "bg-tava-purple text-white shadow-md"
                      : "border border-gray-200 bg-gray-50 text-gray-600 disabled:opacity-40"
                  }`}
                >
                  {n}★
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {artists.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">
          El administrador aún no ha agregado artistas.
        </p>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={() => {
          clearSession();
          window.location.reload();
        }}
        className="mt-8 text-center text-xs text-gray-400 underline"
      >
        Salir de la sesión
      </button>
    </div>
  );
}
