"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShowBrandTitle } from "@/components/ShowBrandTitle";
import {
  resolveEffectiveDisplayScene,
  type DisplayScene,
} from "@/lib/voting/display-scene";
import type { ArtistResult, DailyGame, VotingSession, VotingSummary } from "@/lib/voting/types";
import { TelonTransition } from "./TelonTransition";
import { WordRoulette } from "./WordRoulette";

interface VotingDisplayScreenProps {
  code: string;
}

const emptySummary: VotingSummary = {
  totalVotes: 0,
  currentRoundVotes: 0,
  participantCount: 0,
  currentRoundParticipantCount: 0,
  objectSubmissionCount: 0,
};

function sessionFingerprint(session: VotingSession): string {
  return [
    session.display_scene,
    session.active_game_index,
    session.is_open ? 1 : 0,
    session.show_results ? 1 : 0,
    session.object_collection_open ? 1 : 0,
    session.roulette_spun_at ?? "",
    session.selected_objects?.[0] ?? "",
    (session.daily_games ?? []).length,
  ].join("|");
}

export function VotingDisplayScreen({ code }: VotingDisplayScreenProps) {
  const [session, setSession] = useState<VotingSession | null>(null);
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [summary, setSummary] = useState<VotingSummary>(emptySummary);
  const [error, setError] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<string[]>([]);
  const [rouletteWinner, setRouletteWinner] = useState("");
  const [visibleScene, setVisibleScene] = useState<DisplayScene>("lobby");
  const [telonKey, setTelonKey] = useState(0);
  const [telonPlaying, setTelonPlaying] = useState(false);

  const lastSpinRef = useRef<string | null>(null);
  const firstSceneReady = useRef(false);
  const pendingSceneRef = useRef<DisplayScene | null>(null);
  const visibleSceneRef = useRef<DisplayScene>("lobby");
  const telonPlayingRef = useRef(false);
  const fingerprintRef = useRef("");
  const sessionRef = useRef<VotingSession | null>(null);

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/?join=${encodeURIComponent(code)}`);
  }, [code]);

  useEffect(() => {
    visibleSceneRef.current = visibleScene;
  }, [visibleScene]);

  useEffect(() => {
    telonPlayingRef.current = telonPlaying;
  }, [telonPlaying]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const applySceneChange = useCallback((nextScene: DisplayScene) => {
    // Mismo tipo de escena (ej. solo cambia el juego activo): actualiza sin telón.
    if (nextScene === visibleSceneRef.current) return;
    pendingSceneRef.current = nextScene;
    if (telonPlayingRef.current) return;
    setTelonPlaying(true);
    telonPlayingRef.current = true;
    setTelonKey((key) => key + 1);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/voting/session?code=${encodeURIComponent(code)}&includeResults=true`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      const next = data.session as VotingSession;
      const fp = sessionFingerprint(next);
      const changed = fp !== fingerprintRef.current;
      fingerprintRef.current = fp;

      setSession(next);
      setResults(data.results ?? []);
      setSummary(data.summary ?? emptySummary);
      setError("");

      const effective = resolveEffectiveDisplayScene(next);
      if (!firstSceneReady.current) {
        firstSceneReady.current = true;
        setVisibleScene(effective);
        visibleSceneRef.current = effective;
      } else if (changed) {
        applySceneChange(effective);
      }

      const spunAt = next.roulette_spun_at;
      const winner = next.selected_objects?.[0] ?? "";
      if (spunAt && winner && lastSpinRef.current !== spunAt) {
        lastSpinRef.current = spunAt;
        const candidates =
          next.roulette_candidates?.length > 0 ? next.roulette_candidates : [winner];
        setRouletteItems(candidates);
        setRouletteWinner(winner);
        setRouletteOpen(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, [code, applySceneChange]);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled || document.hidden) return;
      void refresh();
    };
    tick();
    const t = window.setInterval(tick, 1000);
    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    if (!rouletteOpen) return;
    const t = window.setTimeout(() => setRouletteOpen(false), 4200);
    return () => window.clearTimeout(t);
  }, [rouletteOpen, rouletteWinner]);

  useEffect(() => {
    if (!session) return;
    const effective = resolveEffectiveDisplayScene(session);
    if (effective !== "winner" && effective !== "roulette" && rouletteOpen) {
      setRouletteOpen(false);
    }
  }, [session, rouletteOpen]);

  const handleTelonMidpoint = useCallback(() => {
    if (pendingSceneRef.current) {
      setVisibleScene(pendingSceneRef.current);
      visibleSceneRef.current = pendingSceneRef.current;
    }
  }, []);

  const handleTelonComplete = useCallback(() => {
    if (pendingSceneRef.current) {
      setVisibleScene(pendingSceneRef.current);
      visibleSceneRef.current = pendingSceneRef.current;
    }
    const pending = pendingSceneRef.current;
    pendingSceneRef.current = null;
    setTelonPlaying(false);
    telonPlayingRef.current = false;

    const latestSession = sessionRef.current;
    if (pending && latestSession) {
      const latest = resolveEffectiveDisplayScene(latestSession);
      if (latest !== pending) applySceneChange(latest);
    }
  }, [applySceneChange]);

  const qrSrc = useMemo(() => {
    if (!joinUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=10&data=${encodeURIComponent(joinUrl)}`;
  }, [joinUrl]);

  if (!session && !error) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-tava-blue text-tava-yellow">
        <p className="font-display text-4xl tracking-wide">Cargando sala {code}…</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-tava-blue px-6 text-center text-white">
        <ShowBrandTitle size="lg" light />
        <p className="font-display text-3xl text-tava-yellow">Sala no encontrada</p>
        <p className="text-sm text-white/70">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-tava-blue text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,198,0,0.18),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(214,26,33,0.22),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.08),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#ffc600_0.8px,transparent_0.8px)] [background-size:18px_18px]" />

      <WordRoulette
        items={rouletteItems}
        winner={rouletteWinner}
        open={rouletteOpen}
        label={session?.submission_label || "Propuesta"}
        onComplete={() => setRouletteOpen(false)}
      />

      <TelonTransition
        playKey={telonKey}
        onMidpoint={handleTelonMidpoint}
        onComplete={handleTelonComplete}
      />

      <div className="relative z-10 flex h-full flex-col px-6 py-5 sm:px-10 sm:py-8">
        <header className="flex items-start justify-between gap-4">
          <ShowBrandTitle size="md" light className="items-start" />
          <div className="text-right">
            <p className="font-hand text-2xl text-tava-yellow sm:text-3xl">{session?.title}</p>
            <p className="font-display text-2xl tracking-[0.2em] text-white/80 sm:text-3xl">
              {session?.code}
            </p>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <div className={`w-full ${visibleScene === "games" ? "h-full max-w-7xl" : "max-w-6xl"}`}>
            <SceneContent
              scene={visibleScene}
              session={session!}
              summary={summary}
              results={results}
              qrSrc={qrSrc}
              joinUrl={joinUrl}
              rouletteOpen={rouletteOpen}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function SceneContent({
  scene,
  session,
  summary,
  results,
  qrSrc,
  joinUrl,
  rouletteOpen,
}: {
  scene: DisplayScene;
  session: VotingSession;
  summary: VotingSummary;
  results: ArtistResult[];
  qrSrc: string;
  joinUrl: string;
  rouletteOpen: boolean;
}) {
  const winner = session.selected_objects?.[0] ?? "";
  const games = session.daily_games ?? [];

  if (scene === "black") {
    return <div className="min-h-[50vh]" />;
  }

  if (scene === "lobby") {
    return (
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="font-hand text-3xl text-tava-yellow sm:text-4xl">Entren al show</p>
          <h1 className="mt-2 font-display text-6xl leading-none tracking-wide text-white sm:text-7xl md:text-8xl">
            ESCANEEN EL QR
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/75 sm:text-xl">
            O escriban el codigo en el celular. No hace falta cuenta.
          </p>
          <p className="mt-8 font-display text-6xl tracking-[0.25em] text-tava-yellow sm:text-7xl">
            {session.code}
          </p>
        </div>
        <div className="justify-self-center rounded-[2rem] border-4 border-tava-yellow bg-white p-4 shadow-[12px_12px_0_rgba(11,18,32,0.35)]">
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrSrc} alt={`QR ${session.code}`} className="h-64 w-64 sm:h-80 sm:w-80" />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center text-tava-blue sm:h-80 sm:w-80">
              Generando QR…
            </div>
          )}
          <p className="mt-3 max-w-[20rem] break-all text-center text-xs text-gray-500">{joinUrl}</p>
        </div>
      </div>
    );
  }

  if (scene === "collecting") {
    return (
      <div className="text-center">
        <p className="font-hand text-3xl text-tava-yellow sm:text-4xl">
          {session.submission_prompt || "Manden su propuesta"}
        </p>
        <h1 className="mt-3 font-display text-6xl tracking-wide text-white sm:text-8xl">
          RECIBIENDO
        </h1>
        <motion.p
          key={summary.objectSubmissionCount}
          initial={{ scale: 0.85, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-8 font-display text-[8rem] leading-none text-tava-yellow sm:text-[10rem]"
        >
          {summary.objectSubmissionCount}
        </motion.p>
        <p className="font-display text-3xl tracking-wide text-white/80">
          {session.submission_label || "propuestas"}
        </p>
      </div>
    );
  }

  if (scene === "roulette") {
    return (
      <div className="text-center">
        <p className="font-hand text-3xl text-tava-yellow">#TAVA en el acto</p>
        <h1 className="mt-2 font-display text-6xl tracking-wide sm:text-8xl">RULETA</h1>
        <p className="mt-6 text-xl text-white/70">
          {winner ? "Girando / resultado en pantalla" : "Esperando el sorteo del admin…"}
        </p>
        {winner && !rouletteOpen && (
          <p className="mt-10 font-display text-5xl leading-tight text-tava-yellow sm:text-6xl">
            {winner}
          </p>
        )}
      </div>
    );
  }

  if (scene === "winner") {
    return (
      <div className="text-center">
        <p className="font-hand text-3xl text-tava-yellow sm:text-4xl">
          {session.submission_label || "Propuesta"}
        </p>
        <h1 className="mt-2 font-display text-5xl tracking-wide text-white sm:text-6xl">
          PARA ESTA IMPRO
        </h1>
        <motion.p
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto mt-10 max-w-5xl font-display text-5xl leading-tight text-tava-yellow sm:text-6xl md:text-7xl"
        >
          {winner || "Aun no hay ganador"}
        </motion.p>
      </div>
    );
  }

  if (scene === "voting") {
    return (
      <div className="text-center">
        <p className="font-hand text-3xl text-tava-yellow">Ronda {session.current_round}</p>
        <h1 className="mt-2 font-display text-6xl tracking-wide sm:text-8xl">VOTEN YA</h1>
        <p className="mt-6 text-xl text-white/75">Usen el celular. Aqui no se revela el ranking.</p>
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4">
          <StatBig label="Votos" value={summary.currentRoundVotes} />
          <StatBig label="Votantes" value={summary.currentRoundParticipantCount} />
        </div>
      </div>
    );
  }

  if (scene === "results") {
    return (
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <div className="text-center">
          <p className="font-hand text-3xl text-tava-yellow">Resultados de la noche</p>
          <h1 className="mt-1 font-display text-6xl tracking-wide text-white sm:text-7xl">RANKING</h1>
        </div>
        {results.length === 0 ? (
          <p className="mt-10 text-center text-xl text-white/60">Sin votos aun</p>
        ) : (
          <div className="mx-auto mt-8 grid max-w-4xl gap-3">
            {results.map((r, index) => {
              const topThree = index < 3;
              return (
                <motion.div
                  key={r.artist.id}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.08, 0.8) }}
                  className={`flex items-center gap-4 rounded-2xl border-4 px-4 py-4 ${
                    index === 0
                      ? "border-tava-yellow bg-tava-yellow text-tava-blue"
                      : topThree
                        ? "border-white/40 bg-white/15 text-white"
                        : "border-white/20 bg-white/10 text-white"
                  }`}
                >
                  <p className="w-14 shrink-0 font-display text-4xl sm:text-5xl">{index + 1}</p>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-3xl leading-tight sm:text-4xl">
                      {r.artist.name}
                    </p>
                    <p className={`text-sm ${index === 0 ? "text-tava-blue/80" : "text-white/65"}`}>
                      {r.voteCount} votos · promedio {r.average.toFixed(1)}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-4xl sm:text-5xl">{r.totalPoints}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (scene === "games") {
    const activeIndex =
      games.length > 0
        ? Math.max(0, Math.min(session.active_game_index ?? 0, games.length - 1))
        : 0;
    const prev = games[activeIndex - 1] ?? null;
    const current =
      games[activeIndex] ??
      ({ id: "x", name: "Pronto", description: "El admin cargara los juegos del dia" } as DailyGame);
    const next = games[activeIndex + 1] ?? null;
    const rules = session.participant_message?.trim() || "Bienvenidos al show.";

    return (
      <div className="mx-auto grid h-full w-full max-w-7xl grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(280px,34%)_1fr] lg:gap-8">
        {/* Izquierda: control de juegos */}
        <aside className="flex min-h-0 flex-col justify-center gap-3 lg:gap-4">
          <div>
            <p className="font-hand text-xl text-tava-yellow sm:text-2xl">Orden del show</p>
            <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">JUEGOS</h1>
            {games.length > 0 && (
              <p className="mt-1 text-sm font-bold text-white/55">
                {activeIndex + 1} / {games.length}
              </p>
            )}
          </div>
          <GameLane label="Anterior" game={prev} tone="prev" />
          <GameLane label="En curso" game={current} tone="current" />
          <GameLane label="Siguiente" game={next} tone="next" />
        </aside>

        {/* Derecha: reglas grandes para proyector */}
        <section className="flex min-h-0 flex-col justify-center rounded-[2rem] border-4 border-tava-yellow bg-white px-6 py-7 text-tava-blue shadow-[10px_10px_0_rgba(11,18,32,0.35)] sm:px-10 sm:py-10 lg:px-12">
          <p className="text-center font-hand text-3xl text-tava-red sm:text-4xl">Reglas generales</p>
          <h2 className="mt-1 text-center font-display text-5xl tracking-wide text-tava-blue sm:text-6xl md:text-7xl">
            #TAVA
          </h2>
          <div className="mx-auto mt-4 h-1.5 w-24 rounded-full bg-tava-yellow sm:mt-6" />
          <p className="mt-6 whitespace-pre-wrap text-left font-display text-2xl leading-snug tracking-wide text-tava-blue sm:text-3xl md:text-4xl md:leading-tight lg:text-[2.6rem] lg:leading-[1.15]">
            {rules}
          </p>
        </section>
      </div>
    );
  }

  return null;
}

function GameLane({
  label,
  game,
  tone,
}: {
  label: string;
  game: DailyGame | null;
  tone: "prev" | "current" | "next";
}) {
  if (!game) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 px-3 py-3 text-sm text-white/35">
        {label}: —
      </div>
    );
  }

  if (tone === "current") {
    return (
      <div className="rounded-2xl border-4 border-tava-yellow bg-tava-yellow px-4 py-4 text-tava-blue shadow-[6px_6px_0_rgba(11,18,32,0.35)] sm:px-5 sm:py-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-tava-red">{label}</p>
        <p className="mt-1 font-display text-3xl leading-tight tracking-wide sm:text-4xl lg:text-5xl">
          {game.name}
        </p>
        {game.description && (
          <p className="mt-1 line-clamp-3 font-hand text-lg text-tava-red sm:text-xl">{game.description}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/25 bg-white/10 px-3 py-3 text-white/80 sm:px-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tava-yellow/80">{label}</p>
      <p className="mt-0.5 font-display text-xl leading-tight tracking-wide sm:text-2xl">{game.name}</p>
      {game.description && (
        <p className="mt-0.5 line-clamp-2 font-hand text-base text-white/55">{game.description}</p>
      )}
    </div>
  );
}

function StatBig({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border-4 border-tava-yellow bg-white/10 px-4 py-6">
      <p className="text-sm font-black uppercase tracking-widest text-tava-yellow">{label}</p>
      <p className="mt-2 font-display text-6xl text-white">{value}</p>
    </div>
  );
}
