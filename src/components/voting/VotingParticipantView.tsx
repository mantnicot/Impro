"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { clearSession, getSessionCode, getSessionId, getVoterId } from "@/lib/role-storage";
import type { Artist, ArtistResult, VotingSession } from "@/lib/voting/types";
import { ArtistIdentityCard } from "./ArtistIdentityCard";
import { DailyGamesFab } from "./DailyGamesFab";
import { LiveScoreboard } from "./LiveScoreboard";
import { VotingResults } from "./VotingResults";
import { WordRoulette } from "./WordRoulette";

interface MyVote {
  artist_id: string;
  value: number;
}

function rouletteStorageKey(sessionId: string) {
  return `tava-last-roulette-${sessionId}`;
}

function ParticipantLayout({
  session,
  results,
  children,
  footer,
  rouletteOpen,
  rouletteItems,
  rouletteWinner,
  onRouletteComplete,
}: {
  session: VotingSession | null;
  results: ArtistResult[];
  children: React.ReactNode;
  footer?: React.ReactNode;
  rouletteOpen: boolean;
  rouletteItems: string[];
  rouletteWinner: string;
  onRouletteComplete: () => void;
}) {
  const [messageOpen, setMessageOpen] = useState(true);
  const hasMessage = Boolean(session?.participant_message?.trim());

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <WordRoulette
        items={rouletteItems}
        winner={rouletteWinner}
        open={rouletteOpen}
        onComplete={onRouletteComplete}
      />
      <DailyGamesFab games={session?.daily_games ?? []} />

      {results.length > 0 && <LiveScoreboard results={results} compact />}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        {hasMessage && (
          <section className="mx-3 mt-2 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm sm:mx-4 sm:mt-3">
            <button
              type="button"
              onClick={() => setMessageOpen((open) => !open)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left sm:px-4"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                Mensaje del admin
              </p>
              <span className="text-xs font-bold text-indigo-500">{messageOpen ? "Ocultar" : "Ver"}</span>
            </button>
            <AnimatePresence initial={false}>
              {messageOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="whitespace-pre-wrap px-3 pb-3 text-sm leading-relaxed text-gray-800 sm:px-4 sm:pb-4">
                    {session?.participant_message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        <div className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4">{children}</div>
      </div>

      {footer}
    </div>
  );
}

function VoteButtons({
  savedVote,
  pendingVote,
  isVoted,
  savingVotes,
  onSelect,
}: {
  savedVote?: number;
  pendingVote?: number;
  isVoted: boolean;
  savingVotes: boolean;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
        {[1, 2, 3, 4, 5].map((value) => {
          const selected = (isVoted ? savedVote : pendingVote) === value;
          return (
            <button
              key={value}
              type="button"
              disabled={isVoted || savingVotes}
              onClick={() => onSelect(value)}
              className={`min-h-[44px] rounded-xl border text-sm font-black transition sm:py-3 ${
                selected
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-700 active:scale-95 disabled:opacity-50"
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
      {!isVoted && pendingVote != null && (
        <p className="text-center text-xs font-bold text-tava-purple">Nota seleccionada: {pendingVote}</p>
      )}
    </div>
  );
}

function MobileVoteCarousel({
  artists,
  votes,
  pendingVotes,
  savingVotes,
  activeIndex,
  onIndexChange,
  onSelectVote,
}: {
  artists: Artist[];
  votes: Record<string, number>;
  pendingVotes: Record<string, number>;
  savingVotes: boolean;
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onSelectVote: (artistId: string, value: number) => void;
}) {
  const artist = artists[activeIndex];
  if (!artist) return null;

  const savedVote = votes[artist.id];
  const pendingVote = pendingVotes[artist.id];
  const isVoted = savedVote != null;

  const goNext = () => onIndexChange(Math.min(activeIndex + 1, artists.length - 1));
  const goPrev = () => onIndexChange(Math.max(activeIndex - 1, 0));

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const dx = info.offset.x + info.velocity.x * 0.1;
    if (dx < -50) goNext();
    else if (dx > 50) goPrev();
  };

  return (
    <div className="lg:hidden">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={activeIndex === 0}
          onClick={goPrev}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 disabled:opacity-40"
        >
          ← Ant.
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Jugador</p>
          <p className="font-display text-lg font-black text-gray-900">
            {activeIndex + 1} / {artists.length}
          </p>
        </div>
        <button
          type="button"
          disabled={activeIndex >= artists.length - 1}
          onClick={goNext}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 disabled:opacity-40"
        >
          Sig. →
        </button>
      </div>

      <motion.div
        key={artist.id}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        className="touch-pan-y"
      >
        <ArtistIdentityCard artist={artist} compact muted={isVoted}>
          <VoteButtons
            savedVote={savedVote}
            pendingVote={pendingVote}
            isVoted={isVoted}
            savingVotes={savingVotes}
            onSelect={(value) => onSelectVote(artist.id, value)}
          />
        </ArtistIdentityCard>
      </motion.div>

      <div className="mt-3 flex justify-center gap-1.5">
        {artists.map((item, index) => {
          const done = votes[item.id] != null || pendingVotes[item.id] != null;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir a ${item.name}`}
              onClick={() => onIndexChange(index)}
              className={`h-2.5 rounded-full transition ${
                index === activeIndex ? "w-6 bg-tava-purple" : done ? "w-2.5 bg-green-400" : "w-2.5 bg-gray-300"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function VotingParticipantView() {
  const code = getSessionCode();
  const sessionId = getSessionId();
  const voterId = getVoterId();
  const [session, setSession] = useState<VotingSession | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [pendingVotes, setPendingVotes] = useState<Record<string, number>>({});
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [myObjects, setMyObjects] = useState<string[]>([]);
  const [objectInput, setObjectInput] = useState("");
  const [saved, setSaved] = useState("");
  const [savingVotes, setSavingVotes] = useState(false);
  const [savingObject, setSavingObject] = useState(false);
  const [attemptedVoteSubmit, setAttemptedVoteSubmit] = useState(false);
  const [activeArtistIndex, setActiveArtistIndex] = useState(0);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState("");
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<string[]>([]);
  const [rouletteWinner, setRouletteWinner] = useState("");

  const maybeShowRoulette = useCallback((nextSession: VotingSession) => {
    if (!nextSession.roulette_spun_at || !sessionId) return;
    const winner = nextSession.selected_objects?.[0] ?? "";
    if (!winner) return;

    const lastSeen = localStorage.getItem(rouletteStorageKey(sessionId));
    if (lastSeen === nextSession.roulette_spun_at) return;

    const candidates =
      nextSession.roulette_candidates?.length > 0 ? nextSession.roulette_candidates : [winner];
    setRouletteItems(candidates);
    setRouletteWinner(winner);
    setRouletteOpen(true);
  }, [sessionId]);

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
      setResults(data.results ?? []);

      const map: Record<string, number> = {};
      for (const v of (data.myVotes ?? []) as MyVote[]) map[v.artist_id] = v.value;
      setVotes(map);
      setPendingVotes((prev) => {
        const next = { ...prev };
        for (const artistId of Object.keys(map)) delete next[artistId];
        return next;
      });
      setMyObjects(data.myObjectSubmissions ?? []);
      maybeShowRoulette(data.session);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setFirstLoad(false);
    }
  }, [code, voterId, maybeShowRoulette]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 5000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    setActiveArtistIndex((index) => Math.min(index, Math.max(artists.length - 1, 0)));
  }, [artists.length]);

  const handleRouletteComplete = () => {
    if (session?.roulette_spun_at && sessionId) {
      localStorage.setItem(rouletteStorageKey(sessionId), session.roulette_spun_at);
    }
    setRouletteOpen(false);
  };

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

  const selectVote = (artistId: string, value: number) => {
    setPendingVotes((prev) => ({ ...prev, [artistId]: value }));
    if (attemptedVoteSubmit) setError("");
  };

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

  const voteFooter = (
    <section className="shrink-0 border-t border-gray-200 bg-white/95 px-3 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
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
          className={`min-h-[44px] rounded-2xl px-6 py-3 text-sm font-black text-white transition disabled:opacity-45 ${
            allVotesReady ? "bg-green-600" : "bg-tava-purple"
          }`}
        >
          {allVotesDone ? "Ya votaste" : savingVotes ? "Guardando..." : "Enviar votos"}
        </button>
      </div>
    </section>
  );

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

  if (session?.show_results && results.length > 0) {
    return (
      <ParticipantLayout
        session={session}
        results={results}
        rouletteOpen={rouletteOpen}
        rouletteItems={rouletteItems}
        rouletteWinner={rouletteWinner}
        onRouletteComplete={handleRouletteComplete}
      >
        <VotingResults results={results} reveal podium />
        <ExitButton />
      </ParticipantLayout>
    );
  }

  if (session?.is_open) {
    return (
      <ParticipantLayout
        session={session}
        results={results}
        footer={voteFooter}
        rouletteOpen={rouletteOpen}
        rouletteItems={rouletteItems}
        rouletteWinner={rouletteWinner}
        onRouletteComplete={handleRouletteComplete}
      >
        {savingVotes && <SavingOverlay text="Guardando votos" />}

        <section className="rounded-2xl border border-green-200 bg-white p-3 text-center shadow-sm sm:rounded-3xl sm:p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 sm:text-xs sm:tracking-[0.25em]">
            Momento de votacion · Ronda {round}
          </p>
          <h2 className="mt-1 font-display text-xl font-black text-gray-900 sm:text-2xl">
            Califica a cada jugador
          </h2>
          <div className="mt-3 rounded-2xl bg-green-50 p-2.5 sm:p-3">
            <div className="flex items-center justify-between text-xs font-bold text-green-800">
              <span>Listos</span>
              <span>
                {readyVoteCount}/{artists.length}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white sm:h-3">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${artists.length ? (readyVoteCount / artists.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          {attemptedVoteSubmit && missingArtists.length > 0 && (
            <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 sm:px-4 sm:py-3 sm:text-sm">
              Te falta votar por: {missingArtists.map((artist) => artist.name).join(", ")}
            </p>
          )}
          {allVotesDone && (
            <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 sm:px-4 sm:py-3 sm:text-sm">
              Listo. Tus votos quedaron guardados.
            </p>
          )}
        </section>

        {selectedObjects.length > 0 && <SelectedObjects objects={selectedObjects} />}

        {artists.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-500">El administrador aun no ha agregado jugadores.</p>
        ) : (
          <>
            <MobileVoteCarousel
              artists={artists}
              votes={votes}
              pendingVotes={pendingVotes}
              savingVotes={savingVotes}
              activeIndex={activeArtistIndex}
              onIndexChange={setActiveArtistIndex}
              onSelectVote={selectVote}
            />

            <div className="mt-4 hidden gap-4 lg:grid lg:grid-cols-2">
              {artists.map((artist) => {
                const savedVote = votes[artist.id];
                const pendingVote = pendingVotes[artist.id];
                const isVoted = savedVote != null;

                return (
                  <ArtistIdentityCard key={artist.id} artist={artist} muted={isVoted}>
                    <VoteButtons
                      savedVote={savedVote}
                      pendingVote={pendingVote}
                      isVoted={isVoted}
                      savingVotes={savingVotes}
                      onSelect={(value) => selectVote(artist.id, value)}
                    />
                  </ArtistIdentityCard>
                );
              })}
            </div>
          </>
        )}

        {saved && <StatusMessage text={saved} />}
        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
        <ExitButton />
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout
      session={session}
      results={results}
      rouletteOpen={rouletteOpen}
      rouletteItems={rouletteItems}
      rouletteWinner={rouletteWinner}
      onRouletteComplete={handleRouletteComplete}
    >
      {savingObject && <SavingOverlay text="Enviando objeto" />}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm sm:rounded-3xl sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 sm:text-xs sm:tracking-[0.25em]">
          Sala {code}
        </p>
        <h2 className="mt-1 font-display text-xl font-black text-gray-900 sm:text-2xl">
          {session?.object_collection_open ? "Proponer objetos" : "Esperando al admin"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {session?.object_collection_open
            ? "Envia objetos claros para que el sistema sortee una palabra."
            : "Cuando el admin abra votacion, esta pantalla cambiara sola."}
        </p>
      </section>

      {selectedObjects.length > 0 && <SelectedObjects objects={selectedObjects} />}

      {session?.object_collection_open && (
        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:mt-5 sm:p-4">
          <form onSubmit={submitObject} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={objectInput}
              onChange={(e) => setObjectInput(e.target.value)}
              disabled={savingObject}
              maxLength={48}
              placeholder="Ej: paraguas, radio, maleta..."
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={!objectInput.trim() || savingObject}
              className="min-h-[44px] rounded-xl bg-tava-purple px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
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
    </ParticipantLayout>
  );
}

function SelectedObjects({ objects }: { objects: string[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-pink-50 p-3 shadow-sm sm:mt-5 sm:rounded-3xl sm:p-4"
    >
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-amber-700 sm:text-xs">
        {objects.length === 1 ? "Palabra sorteada" : "Objetos sorteados"}
      </p>
      <div className="mt-2 grid gap-2 sm:mt-3">
        {objects.map((objectName, index) => (
          <motion.div
            key={objectName}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.12 }}
            className="rounded-2xl bg-white px-4 py-3 text-center font-display text-lg font-black text-tava-purple shadow-sm sm:text-xl"
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

function ExitButton() {
  return (
    <button
      type="button"
      onClick={() => {
        clearSession();
        window.location.reload();
      }}
      className="mt-6 block w-full text-center text-xs text-gray-400 underline"
    >
      Salir de la sesion
    </button>
  );
}
