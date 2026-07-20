"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { clearSession, getSessionCode, getVoterId } from "@/lib/role-storage";
import type { Artist, ArtistResult, VotingSession } from "@/lib/voting/types";
import { ArtistIdentityCard } from "./ArtistIdentityCard";
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
  const [pendingVotes, setPendingVotes] = useState<Record<string, number>>({});
  const [results, setResults] = useState<ArtistResult[] | null>(null);
  const [myObjects, setMyObjects] = useState<string[]>([]);
  const [objectInput, setObjectInput] = useState("");
  const [saved, setSaved] = useState("");
  const [savingArtistId, setSavingArtistId] = useState<string | null>(null);
  const [savingObject, setSavingObject] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
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
      setPendingVotes((prev) => {
        const next = { ...prev };
        for (const artistId of Object.keys(map)) delete next[artistId];
        return next;
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setFirstLoad(false);
    }
  }, [code, voterId]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const votedCount = useMemo(
    () => artists.filter((artist) => votes[artist.id] != null).length,
    [artists, votes]
  );
  const allVotesDone = artists.length > 0 && votedCount === artists.length;
  const round = session?.current_round ?? 1;
  const selectedObjects = session?.selected_objects ?? [];

  const submitVote = async (artistId: string) => {
    const value = pendingVotes[artistId];
    if (!session?.is_open || !value || votes[artistId] != null) return;
    setSaved("");
    setSavingArtistId(artistId);
    try {
      const res = await fetch("/api/voting/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, artistId, voterId, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.vote) await refresh();
        setError(data.error ?? "Error");
        return;
      }
      await refresh();
      setSaved("Voto guardado");
      setTimeout(() => setSaved(""), 2000);
    } finally {
      setSavingArtistId(null);
    }
  };

  const submitObject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.object_collection_open || !objectInput.trim()) return;
    setSaved("");
    setSavingObject(true);
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
      setSavingObject(false);
    }
  };

  if (firstLoad) {
    return (
      <div className="flex h-full items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-tava-purple/20 border-t-tava-purple"
        />
      </div>
    );
  }

  if (session?.show_results && results) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-8">
        <VotingResults results={results} reveal podium />
        <ExitButton />
      </div>
    );
  }

  if (session?.is_open) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-8 sm:px-5">
        {savingArtistId && <SavingOverlay text="Guardando voto" />}

        <section className="rounded-3xl border border-green-200 bg-white p-4 text-center shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-green-600">
            Momento de votacion
          </p>
          <h2 className="mt-1 font-display text-2xl font-black text-gray-900">
            Califica a cada jugador
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Ronda {round} - Guarda cada voto para que el admin lo vea.
          </p>
          <div className="mt-4 rounded-2xl bg-green-50 p-3">
            <div className="flex items-center justify-between text-xs font-bold text-green-800">
              <span>Progreso</span>
              <span>
                {votedCount}/{artists.length} votos guardados
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${artists.length ? (votedCount / artists.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          {allVotesDone && (
            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
              Listo. Ya votaste por todos y no necesitas votar otra vez.
            </p>
          )}
        </section>

        {selectedObjects.length > 0 && <SelectedObjects objects={selectedObjects} />}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {artists.map((artist) => {
            const savedVote = votes[artist.id];
            const pendingVote = pendingVotes[artist.id];
            const isVoted = savedVote != null;
            const isSaving = savingArtistId === artist.id;

            return (
              <ArtistIdentityCard key={artist.id} artist={artist} muted={isVoted}>
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const selected = (isVoted ? savedVote : pendingVote) === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={isVoted || isSaving}
                          onClick={() => setPendingVotes((prev) => ({ ...prev, [artist.id]: value }))}
                          className={`rounded-xl border py-3 text-sm font-black transition ${
                            selected
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 bg-gray-50 text-gray-700 disabled:opacity-50"
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={isVoted || !pendingVote || isSaving}
                    onClick={() => void submitVote(artist.id)}
                    className={`w-full rounded-2xl py-3 text-sm font-black transition ${
                      isVoted
                        ? "bg-green-100 text-green-700"
                        : "bg-tava-purple text-white disabled:opacity-40"
                    }`}
                  >
                    {isVoted ? `Votado (${savedVote})` : isSaving ? "Guardando..." : "Guardar voto"}
                  </button>

                  {isVoted && (
                    <p className="text-center text-xs font-bold text-green-700">
                      Tu voto quedo guardado. Ya no puedes votar de nuevo por esta persona.
                    </p>
                  )}
                </div>
              </ArtistIdentityCard>
            );
          })}
        </div>

        {artists.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-500">El administrador aun no ha agregado jugadores.</p>
        )}

        {saved && <StatusMessage text={saved} />}
        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
        <ExitButton />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-8">
      {savingObject && <SavingOverlay text="Enviando objeto" />}

      <section className="rounded-3xl border border-gray-200 bg-white p-5 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-400">Sala {code}</p>
        <h2 className="mt-1 font-display text-2xl font-black text-gray-900">
          {session?.object_collection_open ? "Momento de proponer objetos" : "Esperando al admin"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {session?.object_collection_open
            ? "Envia objetos claros para que el sistema sortee tres."
            : "Cuando el admin abra votacion, esta pantalla cambiara automaticamente."}
        </p>
      </section>

      {selectedObjects.length > 0 && <SelectedObjects objects={selectedObjects} />}

      {session?.object_collection_open && (
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            <InfoCard title="Idea clara" text="Escribe un objeto concreto: maleta, radio, sombrilla." tone="amber" />
            <InfoCard title="Una por envio" text="Puedes enviar varias ideas, pero una palabra a la vez." tone="purple" />
            <InfoCard title="Sorteo" text="El admin sortea 3 objetos y apareceran aqui para todos." tone="rose" />
          </div>

          <form onSubmit={submitObject} className="mt-3 flex gap-2">
            <input
              value={objectInput}
              onChange={(e) => setObjectInput(e.target.value)}
              disabled={savingObject}
              maxLength={48}
              placeholder="Ej: paraguas, radio, maleta..."
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={!objectInput.trim() || savingObject}
              className="rounded-xl bg-tava-purple px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              Enviar
            </button>
          </form>

          {myObjects.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {myObjects.map((objectName) => (
                <span
                  key={objectName}
                  className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-tava-purple"
                >
                  {objectName}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {saved && <StatusMessage text={saved} />}
      {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
      <ExitButton />
    </div>
  );
}

function SelectedObjects({ objects }: { objects: string[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 to-pink-50 p-4 shadow-sm"
    >
      <p className="text-center text-xs font-bold uppercase tracking-widest text-amber-700">
        Objetos sorteados
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {objects.map((objectName, index) => (
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
  );
}

function SavingOverlay({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-2xl border border-amber-200 bg-white p-5 text-center shadow-2xl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mx-auto h-12 w-12 rounded-full border-4 border-amber-200 border-t-rose-300"
        />
        <p className="mt-4 font-display text-lg font-black text-gray-800">{text}</p>
        <p className="mt-1 text-xs text-gray-500">Sincronizando con el panel del admin...</p>
      </div>
    </div>
  );
}

function StatusMessage({ text }: { text: string }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-3 text-center text-sm font-bold text-green-600"
    >
      {text}
    </motion.p>
  );
}

function InfoCard({ title, text, tone }: { title: string; text: string; tone: "amber" | "purple" | "rose" }) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    purple: "border-purple-200 bg-purple-50 text-purple-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  };
  return (
    <div className={`rounded-2xl border p-3 ${styles[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wide">{title}</p>
      <p className="mt-1 text-xs">{text}</p>
    </div>
  );
}

function ExitButton() {
  return (
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
  );
}
