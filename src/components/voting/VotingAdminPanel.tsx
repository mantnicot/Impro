"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAdminPin, getSessionCode } from "@/lib/role-storage";
import type { Artist, VotingSession } from "@/lib/voting/types";
import { VotingResults } from "./VotingResults";

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-pin": getAdminPin() ?? "",
    "x-session-code": getSessionCode() ?? "",
  };
}

export function VotingAdminPanel() {
  const code = getSessionCode();
  const [session, setSession] = useState<VotingSession | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [newName, setNewName] = useState("");
  const [liveResults, setLiveResults] = useState<
    { artist: Artist; totalPoints: number; average: number; voteCount: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/voting/session?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data.session);
      setArtists(data.artists ?? []);
      if (data.results) setLiveResults(data.results);

      const resAdmin = await fetch("/api/voting/results", { headers: adminHeaders() });
      if (resAdmin.ok) {
        const adminData = await resAdmin.json();
        setLiveResults(adminData.results ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 3000);
    return () => clearInterval(t);
  }, [refresh]);

  const addArtist = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/voting/artists", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setNewName("");
    void refresh();
  };

  const removeArtist = async (id: string) => {
    await fetch(`/api/voting/artists?id=${id}`, { method: "DELETE", headers: adminHeaders() });
    void refresh();
  };

  const patchSession = async (updates: Partial<{ is_open: boolean; show_results: boolean }>) => {
    const res = await fetch("/api/voting/session", {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify(updates),
    });
    if (res.ok) void refresh();
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-tava-purple/20 border-t-tava-purple"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
      {session && (
        <div className="mb-4 rounded-2xl border border-tava-purple/30 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Código de sala</p>
          <p className="font-display text-3xl font-black tracking-widest text-tava-purple">{session.code}</p>
          <p className="mt-1 text-sm text-gray-600">{session.title}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                session.is_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {session.is_open ? "Votación ABIERTA" : "Votación cerrada"}
            </span>
            {session.show_results && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                Resultados publicados
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void patchSession({ is_open: !session.is_open })}
              className="rounded-xl bg-tava-purple py-3 text-sm font-bold text-white"
            >
              {session.is_open ? "🔒 Cerrar votación" : "🔓 Abrir votación"}
            </button>
            <button
              type="button"
              onClick={() => void patchSession({ show_results: true, is_open: false })}
              className="rounded-xl border-2 border-amber-400 bg-amber-50 py-3 text-sm font-bold text-amber-800"
            >
              🏆 Publicar resultados
            </button>
          </div>
        </div>
      )}

      <h2 className="font-display text-lg font-bold text-gray-800">Artistas</h2>
      <div className="mt-2 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del artista"
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === "Enter" && void addArtist()}
        />
        <button
          type="button"
          onClick={() => void addArtist()}
          className="rounded-xl bg-tava-neon-pink px-4 py-2 text-sm font-bold text-white"
        >
          + Agregar
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {artists.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <span className="font-medium">{a.name}</span>
            <button
              type="button"
              onClick={() => void removeArtist(a.id)}
              className="text-sm text-red-500"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <h2 className="mt-6 font-display text-lg font-bold text-gray-800">Ranking en vivo</h2>
      <div className="mt-2">
        <VotingResults results={liveResults} reveal />
      </div>
    </div>
  );
}
