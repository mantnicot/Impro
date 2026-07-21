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
  const [savingVotes, setSavingVotes] = useState(false);
  const [savingObject, setSavingObject] = useState(false);
  const [attemptedVoteSubmit, setAttemptedVoteSubmit] = useState(false);
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
  const readyVoteCount = useMemo(
    () => artists.filter((artist) => votes[artist.id] != null || pendingVotes[artist.id] != null).length,
    [artists, pendingVotes, votes]
  );
  const missingArtists = useMemo(
    () => artists.filter((artist) => votes[artist.id] == null && pendingVotes[artist.id] == null),
    [artists, pendingVotes, votes]
  );
  const allVotesDone = artists.length > 0 && votedCount === artists.length;
  const allVotesReady = artists.length > 0 && missingArtists.length === 0;
  const round = session?.current_round ?? 1;
  const selectedObjects = session?.selected_objects ?? [];

  const submitAllVotes = async () => {
    if (!session?.is_open || savingVotes) return;
    setAttemptedVoteSubmit(true);
    setSaved("");
    setError("");

    if (artists.length === 0) {
      setError("El administrador aun no ha agregado jugadores.");
      return;
    }

    if (missingArtists.length > 0) {
      setError(`Te falta votar por: ${missingArtists.map((artist) => artist.name).join(", ")}`);
      return;
    }

    const votesToSave = artists
      .filter((artist) => votes[artist.id] == null)
      .map((artist) => ({ artistId: artist.id, value: pendingVotes[artist.id]! }));

    if (votesToSave.length === 0) {
      setSaved("Ya habias enviado todos tus votos.");
      setTimeout(() => setSaved(""), 2000);
      return;
    }

    setSavingVotes(true);
    try {
      const res = await fetch("/api/voting/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, voterId, votes: votesToSave }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      await refresh();
      setSaved("Votos guardados. Ya no necesitas votar otra vez.");
      setTimeout(() => setSaved(""), 2000);
    } finally {
      setSavingVotes(false);
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
      <div className="flex h-full min-h-0 touch-pan-y flex-col overflow-y-auto overscroll-contain px-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch]">
        <VotingResults results={results} reveal podium />
        <ExitButton />
      </div>
    );
  }

  if (session?.is_open) {
    return (
      <div className="flex h-full min-h-0 touch-pan-y flex-col overflow-y-auto overscroll-contain px-3 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch] sm:px-5">
        {savingVotes && <SavingOverlay text="Guardando votos" />}

        <section className="rounded-3xl border border-green-200 bg-white p-4 text-center shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-green-600">
            Momento de votacion
          </p>
          <h2 className="mt-1 font-display text-2xl font-black text-gray-900">
            Califica a cada jugador
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Ronda {round} - Marca una nota para todos y envia una sola vez.
          </p>
          <div className="mt-4 rounded-2xl bg-green-50 p-3">
            <div className="flex items-center justify-between text-xs font-bold text-green-800">
              <span>Calificaciones listas</span>
              <span>
                {readyVoteCount}/{artists.length}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${artists.length ? (readyVoteCount / artists.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          {attemptedVoteSubmit && missingArtists.length > 0 && (
            <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
              Te falta votar por: {missingArtists.map((artist) => artist.name).join(", ")}
            </p>
          )}
          {allVotesDone && (
            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
              Listo. Tus votos quedaron guardados y no necesitas votar otra vez.
            </p>
          )}
        </section>

        {selectedObjects.length > 0 && <SelectedObjects objects={selectedObjects} />}

        <div className="mt-4 grid gap-4 pb-4 lg:grid-cols-2">
          {artists.map((artist) => {
            const savedVote = votes[artist.id];
            const pendingVote = pendingVotes[artist.id];
            const isVoted = savedVote != null;

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
                          disabled={isVoted || savingVotes}
                          onClick={() => {
                            setPendingVotes((prev) => ({ ...prev, [artist.id]: value }));
                            if (attemptedVoteSubmit) setError("");
                          }}
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

                  {isVoted && (
                    <p className="text-center text-xs font-bold text-green-700">
                      Guardado con {savedVote}. Este voto ya no se puede cambiar.
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

        <section className="sticky bottom-0 z-20 -mx-3 mt-2 border-t border-gray-200 bg-white/95 px-3 py-3 shadow-[0_-10px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:-mx-5 sm:px-5">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-xs font-bold text-gray-500 sm:text-left">
              {allVotesDone
                ? "Votacion enviada."
                : allVotesReady
                  ? "Todo listo para enviar."
                  : `Faltan ${missingArtists.length} jugador${missingArtists.length === 1 ? "" : "es"}.`}
            </p>
            <button
              type="button"
              disabled={savingVotes || allVotesDone || artists.length === 0}
              onClick={() => void submitAllVotes()}
              className={`rounded-2xl px-6 py-3 text-sm font-black text-white transition disabled:opacity-45 ${
                allVotesReady ? "bg-green-600" : "bg-tava-purple"
              }`}
            >
              {allVotesDone ? "Ya votaste" : savingVotes ? "Guardando..." : "Votar"}
            </button>
          </div>
        </section>

        {saved && <StatusMessage text={saved} />}
        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
        <ExitButton />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 touch-pan-y flex-col overflow-y-auto overscroll-contain px-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch]">
      {savingObject && <SavingOverlay text="Enviando objeto" />}

      <section className="rounded-3xl border border-gray-200 bg-white p-5 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-400">Sala {code}</p>
        <h2 className="mt-1 font-display text-2xl font-black text-gray-900">
          {session?.object_collection_open ? "Momento de proponer objetos" : "Esperando al admin"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {session?.object_collection_open
            ? "Envia objetos claros para que el sistema sortee una palabra."
            : "Cuando el admin abra votacion, esta pantalla cambiara automaticamente."}
        </p>
      </section>

      {selectedObjects.length > 0 && <SelectedObjects objects={selectedObjects} />}

      {session?.object_collection_open && (
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            <InfoCard title="Idea clara" text="Escribe un objeto concreto: maleta, radio, sombrilla." tone="amber" />
            <InfoCard title="Una por envio" text="Puedes enviar varias ideas, pero una palabra a la vez." tone="purple" />
            <InfoCard title="Sorteo" text="El admin sortea una palabra y aparecera aqui para todos." tone="rose" />
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
        {objects.length === 1 ? "Palabra sorteada" : "Objetos sorteados"}
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
