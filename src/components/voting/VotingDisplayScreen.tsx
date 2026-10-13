"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BrandIntroLoop, BrandIntroTransition } from "@/components/BrandIntro";
import ClosedCurtain from "@/components/ClosedCurtain";
import ShowAtmosphere from "@/components/ShowAtmosphere";
import { ShowBrandTitle } from "@/components/ShowBrandTitle";
import {
  detectGameModeHint,
  getActiveDailyGame,
  resolveDisplayScene,
  resolveEffectiveDisplayScene,
  shouldShowStageRoulette,
  type DisplayScene,
} from "@/lib/voting/display-scene";
import {
  currentDrawnObject,
  type ArtistResult,
  type DailyGame,
  type VotingSession,
  type VotingSummary,
} from "@/lib/voting/types";
import { GameSwap, LiveGameCard, RankingItem, RankingList } from "./GeneralAmbient";
import { GlowText, HeroText, PulseFrame } from "./LobbyAmbient";
import { TelonTransition } from "./TelonTransition";
import { WinnerPodiumReveal } from "./WinnerPodiumReveal";
import { WordRoulette } from "./WordRoulette";

interface VotingDisplayScreenProps {
  code: string;
}

function ProjectorChrome() {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* navegador bloqueó pantalla completa */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void toggleFullscreen()}
        className="fixed right-4 top-4 z-[100] flex min-h-10 items-center gap-2 rounded-xl border-2 border-tava-yellow bg-tava-blue/90 px-3 py-2 font-display text-xs uppercase tracking-wider text-tava-yellow shadow-[4px_4px_0_rgba(11,18,32,0.4)] backdrop-blur-sm transition hover:bg-tava-blue sm:text-sm"
        title={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 fill-none stroke-current stroke-2"
        >
          {fullscreen ? (
            <>
              <path d="M9 9H5V5M15 9h4V5M15 15h4v4M9 15H5v4" />
            </>
          ) : (
            <>
              <path d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4" />
            </>
          )}
        </svg>
        <span className="hidden sm:inline">{fullscreen ? "Salir" : "Pantalla completa"}</span>
      </button>

      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] sm:bottom-6 sm:right-6"
        aria-hidden
      >
        <div className="rounded-2xl border-2 border-tava-yellow bg-white/95 p-2 shadow-[6px_6px_0_rgba(11,18,32,0.35)] sm:p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-tava.jpg"
            alt=""
            className="h-12 w-12 object-contain opacity-90 sm:h-14 sm:w-14"
          />
        </div>
      </div>
    </>
  );
}

const emptySummary: VotingSummary = {
  totalVotes: 0,
  currentRoundVotes: 0,
  participantCount: 0,
  currentRoundParticipantCount: 0,
  objectSubmissionCount: 0,
};

function sessionFingerprint(session: VotingSession): string {
  const hint = detectGameModeHint(getActiveDailyGame(session));
  return [
    session.display_scene,
    session.active_game_index,
    hint,
    session.is_open ? 1 : 0,
    session.show_results ? 1 : 0,
    session.object_collection_open ? 1 : 0,
    session.roulette_spun_at ?? "",
    currentDrawnObject(session.selected_objects),
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
  const [transitionKind, setTransitionKind] = useState<"telon" | "brand">("telon");

  const lastSpinRef = useRef<string | null>(null);
  const firstSceneReady = useRef(false);
  const pendingSceneRef = useRef<DisplayScene | null>(null);
  const visibleSceneRef = useRef<DisplayScene>("lobby");
  const telonPlayingRef = useRef(false);
  const transitionKindRef = useRef<"telon" | "brand">("telon");
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
    // Mismo tipo de escena (ej. solo cambia el juego activo): actualiza sin transición.
    if (nextScene === visibleSceneRef.current) return;
    pendingSceneRef.current = nextScene;
    if (telonPlayingRef.current) return;
    // Votación: animación de marca TAVA; el resto: telón.
    const kind: "telon" | "brand" = nextScene === "voting" ? "brand" : "telon";
    transitionKindRef.current = kind;
    setTransitionKind(kind);
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

      const configured = resolveDisplayScene(next.display_scene);
      const effective = resolveEffectiveDisplayScene(next);
      const spunAt = next.roulette_spun_at;
      const winner = currentDrawnObject(next.selected_objects);
      const allowRoulette = shouldShowStageRoulette(next);

      if (!firstSceneReady.current) {
        firstSceneReady.current = true;
        setVisibleScene(effective);
        visibleSceneRef.current = effective;
        // No re-reproduce un sorteo viejo al abrir el proyector
        if (spunAt) lastSpinRef.current = spunAt;
      } else if (changed) {
        // Auto y botones manuales: siempre con telón al cambiar de escena
        applySceneChange(effective);
      }

      if (
        configured === "winner" ||
        effective === "winner" ||
        configured === "results" ||
        effective === "results"
      ) {
        setRouletteOpen(false);
      }

      if (spunAt && winner && allowRoulette && lastSpinRef.current !== spunAt) {
        lastSpinRef.current = spunAt;
        const candidates =
          next.roulette_candidates?.length > 0 ? next.roulette_candidates : [winner];
        setRouletteItems(candidates);
        setRouletteWinner(winner);
        setRouletteOpen(true);
      } else if (!allowRoulette) {
        setRouletteOpen(false);
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
    <div className="relative isolate h-[100dvh] overflow-hidden bg-tava-blue text-white">
      {visibleScene === "lobby" ? (
        <ClosedCurtain />
      ) : visibleScene === "general" || visibleScene === "games" ? (
        <ShowAtmosphere variant="general" />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,198,0,0.18),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(214,26,33,0.22),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.08),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#ffc600_0.8px,transparent_0.8px)] [background-size:18px_18px]" />
        </>
      )}

      <WordRoulette
        items={rouletteItems}
        winner={rouletteWinner}
        open={rouletteOpen}
        stage
        autoDismissMs={2200}
        label={session?.submission_label || "Propuesta"}
        onComplete={() => setRouletteOpen(false)}
      />

      {transitionKind === "brand" ? (
        <BrandIntroTransition
          playKey={telonKey}
          playing={telonPlaying}
          onMidpoint={handleTelonMidpoint}
          onComplete={handleTelonComplete}
        />
      ) : (
        <TelonTransition
          playKey={telonKey}
          playing={telonPlaying}
          onMidpoint={handleTelonMidpoint}
          onComplete={handleTelonComplete}
        />
      )}

      <ProjectorChrome />

      {visibleScene === "results" || visibleScene === "winner" ? (
        <div className="relative z-10 h-full w-full">
          {results.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="font-hand text-3xl text-tava-yellow">Ranking de la noche</p>
              <h1 className="font-display text-5xl tracking-wide text-white">SIN VOTOS AUN</h1>
            </div>
          ) : (
            <WinnerPodiumReveal
              key={`${visibleScene}-${results.map((r) => `${r.artist.id}:${r.totalPoints}`).join("|")}`}
              results={results}
              title={session?.title || "Ranking de la noche"}
            />
          )}
        </div>
      ) : (
        <div className="relative z-10 flex h-full flex-col px-6 py-5 sm:px-10 sm:py-8">
          <header className="flex items-start justify-between gap-4 pr-28 sm:pr-36">
            <ShowBrandTitle size="md" light className="items-start" />
            <div className="text-right">
              <p className="font-hand text-2xl text-tava-yellow sm:text-3xl">{session?.title}</p>
              <p className="font-display text-2xl tracking-[0.2em] text-white/80 sm:text-3xl">
                {session?.code}
              </p>
            </div>
          </header>

          <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <div
              className={`w-full ${
                visibleScene === "general" || visibleScene === "games" ? "h-full max-w-7xl" : "max-w-6xl"
              }`}
            >
              <SceneContent
                scene={visibleScene === "games" ? "general" : visibleScene}
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
      )}
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
  const winner = currentDrawnObject(session.selected_objects);
  const games = session.daily_games ?? [];

  if (scene === "black") {
    return <div className="min-h-[50vh]" />;
  }

  if (scene === "lobby") {
    return (
      <div className="grid h-full items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <BrandIntroLoop className="mx-auto h-[min(52vh,28rem)] w-full max-w-xl lg:mx-0 lg:h-[min(70vh,36rem)]" />
        <div className="flex flex-col items-center text-center lg:items-end lg:text-right">
          <p className="font-hand text-3xl text-tava-yellow sm:text-4xl">Entren al show</p>
          <HeroText>
            <h1 className="mt-2 font-display text-5xl leading-none tracking-wide text-white sm:text-6xl md:text-7xl">
              ESCANEEN EL QR
            </h1>
          </HeroText>
          <p className="mt-3 max-w-md text-lg text-white/75 sm:text-xl lg:ml-auto">
            O escriban el codigo en el celular. No hace falta cuenta.
          </p>
          <GlowText className="mt-5 font-display text-5xl tracking-[0.25em] text-tava-yellow sm:text-6xl">
            {session.code}
          </GlowText>
          <PulseFrame className="mt-6 justify-self-center" radiusClass="rounded-[2rem]">
            <div className="rounded-[2rem] border-4 border-tava-yellow bg-white p-4 shadow-[12px_12px_0_rgba(11,18,32,0.35)]">
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrSrc} alt={`QR ${session.code}`} className="h-56 w-56 sm:h-72 sm:w-72" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center text-tava-blue sm:h-72 sm:w-72">
                  Generando QR…
                </div>
              )}
              <p className="mt-3 max-w-[18rem] break-all text-center text-xs text-gray-500">{joinUrl}</p>
            </div>
          </PulseFrame>
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

  // "winner" = mismo podio que publicar ranking (se renderiza a pantalla completa arriba)
  if (scene === "winner" || scene === "results") {
    return results.length === 0 ? (
      <div className="text-center">
        <p className="font-hand text-3xl text-tava-yellow">Ranking de la noche</p>
        <h1 className="mt-2 font-display text-5xl tracking-wide text-white">SIN VOTOS AUN</h1>
      </div>
    ) : (
      <WinnerPodiumReveal results={results} title={session.title} className="relative h-[70vh] w-full" />
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

  if (scene === "general" || scene === "games" || scene === "auto") {
    const activeIndex =
      games.length > 0
        ? Math.max(0, Math.min(session.active_game_index ?? 0, games.length - 1))
        : 0;
    const prev = games[activeIndex - 1] ?? null;
    const current =
      games[activeIndex] ??
      ({ id: "x", name: "Pronto", description: "El admin cargara los juegos del dia" } as DailyGame);
    const next = games[activeIndex + 1] ?? null;
    const rules = session.participant_message?.trim() || "";
    const topResults = results.slice(0, 6);

    const rankingVersion = topResults.map((r) => `${r.artist.id}:${r.totalPoints}`).join("|");

    return (
      <div className="mx-auto grid h-full w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <section className="flex min-h-0 flex-col justify-center gap-3">
          <div>
            <p className="font-hand text-2xl text-tava-yellow sm:text-3xl">{session.title}</p>
            <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">GENERAL</h1>
            {games.length > 0 && (
              <p className="mt-1 text-sm font-bold text-white/55">
                Juego {activeIndex + 1} / {games.length}
              </p>
            )}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 px-4 py-3 opacity-45 blur-[1px]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Anterior</p>
            <p className="font-display text-2xl text-white/70">{prev?.name ?? "—"}</p>
          </div>

          <LiveGameCard radiusClass="rounded-3xl">
            <GameSwap gameKey={current.id + String(activeIndex)}>
              <div className="rounded-3xl border-4 border-tava-yellow bg-tava-yellow px-5 py-5 text-tava-blue">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-tava-red">En curso</p>
                <p className="mt-1 font-display text-4xl leading-tight tracking-wide sm:text-5xl">
                  {current.name}
                </p>
                {current.description && (
                  <p className="mt-2 font-hand text-xl text-tava-red sm:text-2xl">{current.description}</p>
                )}
              </div>
            </GameSwap>
          </LiveGameCard>

          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 px-4 py-3 opacity-45 blur-[1px]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Siguiente</p>
            <p className="font-display text-2xl text-white/70">{next?.name ?? "—"}</p>
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-3">
          {rules && (
            <div className="rounded-3xl border-4 border-tava-yellow bg-white px-5 py-4 text-tava-blue shadow-[8px_8px_0_rgba(11,18,32,0.3)]">
              <p className="font-hand text-2xl text-tava-red">Info del show</p>
              <p className="mt-2 max-h-[18vh] overflow-y-auto whitespace-pre-wrap font-display text-lg leading-snug sm:text-xl">
                {rules}
              </p>
            </div>
          )}

          <div className="min-h-0 flex-1 rounded-3xl border border-white/20 bg-white/10 px-4 py-3">
            <p className="text-center font-hand text-2xl text-tava-yellow">Ranking</p>
            {topResults.length === 0 ? (
              <p className="mt-4 text-center text-white/50">Sin votos aun</p>
            ) : (
              <RankingList version={rankingVersion} className="mt-2 space-y-1.5">
                {topResults.map((r, index) => (
                  <RankingItem
                    key={r.artist.id}
                    index={index}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
                      index === 0
                        ? "bg-tava-yellow text-tava-blue"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <span className="w-8 font-display text-xl sm:text-2xl">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-display text-lg sm:text-xl">
                      {r.artist.name}
                    </span>
                    <span className="font-display text-xl sm:text-2xl">{r.totalPoints}</span>
                  </RankingItem>
                ))}
              </RankingList>
            )}
          </div>

          {/* QR para quienes llegan tarde */}
          <div className="flex items-center gap-3 rounded-3xl border-4 border-tava-yellow bg-white p-3 text-tava-blue shadow-[6px_6px_0_rgba(11,18,32,0.3)]">
            <PulseFrame radiusClass="rounded-2xl" className="shrink-0">
              <div className="rounded-2xl border-2 border-tava-yellow bg-white p-1.5">
                {qrSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrSrc}
                    alt={`QR ${session.code}`}
                    className="h-24 w-24 sm:h-28 sm:w-28"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center text-xs font-bold text-tava-blue sm:h-28 sm:w-28">
                    QR…
                  </div>
                )}
              </div>
            </PulseFrame>
            <div className="min-w-0 flex-1">
              <p className="font-hand text-xl text-tava-red sm:text-2xl">Llegas tarde?</p>
              <p className="font-display text-sm tracking-wide text-tava-blue/80 sm:text-base">
                Escanea o escribe el codigo
              </p>
              <GlowText className="mt-1 font-display text-3xl tracking-[0.18em] text-tava-blue sm:text-4xl">
                {session.code}
              </GlowText>
            </div>
          </div>
        </section>
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
