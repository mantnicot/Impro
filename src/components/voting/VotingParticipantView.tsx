"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { clearSession, getSessionCode, getVoterId } from "@/lib/role-storage";
import type { Artist, ArtistResult, VotingSession } from "@/lib/voting/types";
import { VotingResults } from "./VotingResults";

interface MyVote {
  artist_id: string;
  value: number;
}

export function VotingParticipantView() {
  const code = getSessionCode();
  const voterId = getVoterId();
  const [session, setSession] = useState<VotingSession | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [results, setResults] = useState<ArtistResult[] | null>(null);
  const [myObjects, setMyObjects] = useState<string[]>([]);
  const [objectInput, setObjectInput] = useState("");
  const [saved, setSaved] = useState("");
  const [savingAction, setSavingAction] = useState<"vote" | "object" | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(
        `/api/voting/session?code=${encodeURIComponent(code)}&voterId=${encodeURIComponent(voterId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data.session);
      setArtists(data.artists ?? []);
      if (data.results) setResults(data.results);
      setMyObjects(data.myObjectSubmissions ?? []);

      const map: Record<string, number> = {};
      for (const v of (data.myVotes ?? []) as MyVote[]) map[v.artist_id] = v.value;
      setVotes(map);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, [code, voterId]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const submitVote = async (artistId: string, value: number) => {
    if (!session?.is_open) return;
    setVotes((prev) => ({ ...prev, [artistId]: value }));
    setSaved("");
    setSavingAction("vote");
    try {
      const res = await fetch("/api/voting/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, artistId, voterId, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      await refresh();
      setSaved("Voto guardado");
      setTimeout(() => setSaved(""), 2000);
    } finally {
      setSavingAction(null);
    }
  };

  const submitObject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.object_collection_open || !objectInput.trim()) return;
    setSaved("");
    setSavingAction("object");
    try {
      const res = await fetch("/api/voting/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          voterId,
          objectName: objectInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      setObjectInput("");
      await refresh();
      setSaved("Objeto enviado");
      setTimeout(() => setSaved(""), 2000);
    } finally {
      setSavingAction(null);
    }
  };

  if (session?.show_results && results) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-8">
        <VotingResults results={results} reveal podium />
        <button
          type="button"
          onClick={() => {
            clearSession();
            window.location.reload();
          }}
          className="mt-8 text-center text-xs text-gray-400 underline"
        >
          Salir de la sesion
        </button>
      </div>
    );
  }

  const round = session?.current_round ?? 1;
  const selectedObjects = session?.selected_objects ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-8">
      {savingAction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/75 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-amber-200 bg-white p-5 text-center shadow-2xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="mx-auto h-12 w-12 rounded-full border-4 border-amber-200 border-t-rose-300"
            />
            <p className="mt-4 font-display text-lg font-black text-gray-800">
              {savingAction === "vote" ? "Guardando voto" : "Enviando objeto"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Sincronizando con el panel del admin...
            </p>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Sala {code}</p>
        <h2 className="font-display text-xl font-bold text-gray-800">{session?.title ?? "Votacion TAVA"}</h2>
        <p className="mt-1 text-xs font-semibold text-tava-purple">Ronda {round}</p>
        <p
          className={`mt-2 inline-block rounded-full px-4 py-1 text-xs font-bold ${
            session?.is_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {session?.is_open ? "Puedes votar en esta ronda" : "Votacion cerrada"}
        </p>
      </div>

      {selectedObjects.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 to-pink-50 p-4 shadow-sm"
        >
          <p className="text-center text-xs font-bold uppercase tracking-widest text-amber-700">
            Objetos sorteados
          </p>
          <div className="mt-3 grid gap-2">
            {selectedObjects.map((objectName, index) => (
              <motion.div
                key={objectName}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.12 }}
                className="rounded-2xl bg-white px-4 py-3 text-center font-display text-xl font-black text-tava-purple shadow-sm"
              >
                {objectName}
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-gray-800">Proponer objetos</h3>
            <p className="text-xs text-gray-500">Cuando el admin lo abra, envia ideas para el sorteo.</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              session?.object_collection_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {session?.object_collection_open ? "Abierto" : "Cerrado"}
          </span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-amber-800">Idea clara</p>
            <p className="mt-1 text-xs text-amber-900">Escribe un objeto concreto: maleta, radio, sombrilla.</p>
          </div>
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-tava-purple">Una por envio</p>
            <p className="mt-1 text-xs text-purple-900">Puedes enviar varias ideas, pero una palabra a la vez.</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-rose-700">Sorteo</p>
            <p className="mt-1 text-xs text-rose-900">El admin sortea 3 objetos y apareceran aqui para todos.</p>
          </div>
        </div>

        <form onSubmit={submitObject} className="mt-3 flex gap-2">
          <input
            value={objectInput}
            onChange={(e) => setObjectInput(e.target.value)}
            disabled={!session?.object_collection_open || !!savingAction}
            maxLength={48}
            placeholder="Ej: paraguas, radio, maleta..."
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={!session?.object_collection_open || !objectInput.trim() || !!savingAction}
            className="rounded-xl bg-tava-purple px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {savingAction === "object" ? "..." : "Enviar"}
          </button>
        </form>

        {myObjects.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {myObjects.map((objectName) => (
              <span key={objectName} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-tava-purple">
                {objectName}
              </span>
            ))}
          </div>
        )}
      </section>

      {saved && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-center text-sm font-bold text-green-600"
        >
          {saved}
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
                  disabled={!session?.is_open || !!savingAction}
                  onClick={() => void submitVote(artist.id, n)}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${
                    votes[artist.id] === n
                      ? "bg-tava-purple text-white shadow-md"
                      : "border border-gray-200 bg-gray-50 text-gray-600 disabled:opacity-40"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {artists.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">El administrador aun no ha agregado artistas.</p>
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
        Salir de la sesion
      </button>
    </div>
  );
}
