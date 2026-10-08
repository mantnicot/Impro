"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShowBrandTitle } from "@/components/ShowBrandTitle";
import {
  resolveEffectiveDisplayScene,
  type DisplayScene,
} from "@/lib/voting/display-scene";
import type { ArtistResult, DailyGame, VotingSession, VotingSummary } from "@/lib/voting/types";
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

export function VotingDisplayScreen({ code }: VotingDisplayScreenProps) {
  const [session, setSession] = useState<VotingSession | null>(null);
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [summary, setSummary] = useState<VotingSummary>(emptySummary);
  const [error, setError] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<string[]>([]);
  const [rouletteWinner, setRouletteWinner] = useState("");
  const lastSpinRef = useRef<string | null>(null);

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/?join=${encodeURIComponent(code)}`);
  }, [code]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/voting/session?code=${encodeURIComponent(code)}&includeResults=true`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      const next = data.session as VotingSession;
      setSession(next);
      setResults(data.results ?? []);
      setSummary(data.summary ?? emptySummary);
      setError("");

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
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled || document.hidden) return;
      void refresh();
    };
    tick();
    const t = window.setInterval(tick, 2500);
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

  // En proyector no hace falta tocar: la ruleta cierra sola tras el ganador.
  useEffect(() => {
    if (!rouletteOpen) return;
    const t = window.setTimeout(() => setRouletteOpen(false), 3800);
    return () => window.clearTimeout(t);
  }, [rouletteOpen, rouletteWinner]);

  const scene = useMemo(
    () => (session ? resolveEffectiveDisplayScene(session) : "lobby"),
    [session]
  );

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

        <main className="flex min-h-0 flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene}
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 1.02 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-6xl"
            >
              <SceneContent
                scene={scene}
                session={session!}
                summary={summary}
                results={results}
                qrSrc={qrSrc}
                joinUrl={joinUrl}
                rouletteOpen={rouletteOpen}
              />
            </motion.div>
          </AnimatePresence>
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
    const top = results.slice(0, 3);
    return (
      <div>
        <div className="text-center">
          <p className="font-hand text-3xl text-tava-yellow">Ganadores de la noche</p>
          <h1 className="mt-1 font-display text-6xl tracking-wide text-white sm:text-7xl">PODIO</h1>
        </div>
        {top.length === 0 ? (
          <p className="mt-10 text-center text-xl text-white/60">Sin votos aun</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 items-end gap-4 md:grid-cols-3">
            {top.map((r, index) => (
              <motion.div
                key={r.artist.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className={`rounded-3xl border-4 px-4 py-6 text-center ${
                  index === 0
                    ? "border-tava-yellow bg-tava-yellow text-tava-blue md:min-h-[18rem]"
                    : "border-white/30 bg-white/10 text-white md:min-h-[14rem]"
                }`}
              >
                <p className="font-display text-4xl">{index + 1}</p>
                <p className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{r.artist.name}</p>
                <p className="mt-4 font-display text-5xl">{r.totalPoints}</p>
                <p className="mt-1 text-sm opacity-70">promedio {r.average.toFixed(1)}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (scene === "games") {
    return (
      <div>
        <div className="text-center">
          <p className="font-hand text-3xl text-tava-yellow">Hoy jugamos</p>
          <h1 className="mt-1 font-display text-6xl tracking-wide sm:text-7xl">JUEGOS</h1>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4">
          {(games.length > 0 ? games : [{ id: "x", name: "Pronto", description: "El admin cargara los juegos" } as DailyGame]).map(
            (game) => (
              <div
                key={game.id}
                className="rounded-3xl border-4 border-tava-yellow bg-white/95 px-6 py-5 text-tava-blue"
              >
                <p className="font-display text-4xl tracking-wide">{game.name}</p>
                {game.description && (
                  <p className="mt-2 font-hand text-2xl text-tava-red">{game.description}</p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return null;
}

function StatBig({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border-4 border-tava-yellow bg-white/10 px-4 py-6">
      <p className="text-sm font-black uppercase tracking-widest text-tava-yellow">{label}</p>
      <p className="mt-2 font-display text-6xl text-white">{value}</p>
    </div>
  );
}
