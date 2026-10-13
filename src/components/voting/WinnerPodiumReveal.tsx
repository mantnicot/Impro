"use client";

/**
 * WinnerPodiumReveal — escena de proyector "GANADOR / RANKING NOCHE" de #TAVA en el acto.
 *
 * Solo UI + animación sobre `results` ya ordenado (índice 0 = 1er lugar).
 * No toca votación móvil ni base de datos.
 *
 * ⚠️ AJUSTA antes de pegar:
 *   1) Las dos rutas de import de abajo (ArtistIdentityCard y el tipo ArtistResult).
 *   2) CARD_W / CARD_H: tamaño "natural" en px de ArtistIdentityCard (proporción Panini).
 *      El componente lo escala con transform, así que NO necesitas modificar la carta.
 *   3) Se asume que la carta se llama `<ArtistIdentityCard artist={...} />`, que llena
 *      el ancho/alto de su contenedor, y que `artist` tiene `id` y `name`.
 *   4) Usa las clases `font-display` y `font-hand` que ya existen en tu Tailwind.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArtistIdentityCard } from "@/components/voting/ArtistIdentityCard";
import type { ArtistResult } from "@/lib/voting/types";

/* ───────────────────────── Constantes de diseño ───────────────────────── */

const STAGE_W = 1920; // lienzo de diseño 16:9; se escala entero a la pantalla
const STAGE_H = 1080;

const CARD_W = 320; // ⚠️ tamaño natural de ArtistIdentityCard (5:7 aprox.)
const CARD_H = 448;

const BRAND = {
  blue: "#1A3A82",
  red: "#D61A21",
  yellow: "#FFC600",
  night: "#050D26",
  white: "#FFFFFF",
} as const;

const CONFETTI_COLORS = [BRAND.yellow, BRAND.red, BRAND.white, BRAND.yellow, BRAND.white];

/** Coreografía en milisegundos desde que se monta el componente. */
export const TIMINGS = {
  curtain: 450, //     telón se abre (≈0.4 s)
  packStart: 450, //   entra el resto (4º en adelante) con stagger
  packStagger: 70, //  ms entre carta y carta del resto
  third: 1500, //      sube el 3º
  second: 2300, //     sube el 2º
  base: 3100, //       sube el escalón vacío del 1º + pausa dramática
  impact: 4100, //     IMPACTO: sello del 1º + flash + confeti fuerte
  title: 4400, //      título "GANADOR" + nombre
} as const;

type Phase = "intro" | "pack" | "third" | "second" | "base" | "impact" | "title";
const PHASES: Phase[] = ["intro", "pack", "third", "second", "base", "impact", "title"];

const CX = STAGE_W / 2;
const BASELINE = 800; // y donde se apoyan los escalones
const OVERLAP = 14; //   cuánto se "mete" la carta sobre el escalón
const WINNER_RADIUS = 20; // ⚠️ ajusta al radio de borde de tu carta

const WINNER = { scale: 1, blockW: 440, blockH: 150, dx: 0 } as const;
const SECOND = { scale: 0.8, blockW: 320, blockH: 100, dx: -410 } as const;
const THIRD = { scale: 0.8, blockW: 320, blockH: 70, dx: 410 } as const;

const REST_TOP = 840;
const REST_GAP = 20;
const REST_MAX_W = 1760;

/* ───────────────────────────── Confeti (canvas) ───────────────────────────── */

type Particle = {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; rot: number; vr: number; flip: number; vf: number;
  color: string; age: number; max: number; round: boolean;
};

type BurstOpts = { x: number; y: number; count: number; angle: number; spread: number; speed: number };

const MAX_PARTICLES = 520;

function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parts = useRef<Particle[]>([]);
  const raf = useRef(0);
  const last = useRef(0);

  const tick = useCallback(function loop(t: number) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      raf.current = 0;
      return;
    }
    const dt = Math.min(0.033, (t - (last.current || t)) / 1000);
    last.current = t;
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);

    const ps = parts.current;
    const drag = Math.exp(-1.6 * dt);
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]!;
      p.age += dt;
      p.vy += 900 * dt; // gravedad
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      if (p.age > p.max || p.y > STAGE_H + 40) {
        ps.splice(i, 1);
        continue;
      }
      const fade = p.age > p.max - 0.6 ? Math.max(0, (p.max - p.age) / 0.6) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      const sy = Math.abs(Math.cos(p.flip)); // efecto "volteo" del papel
      if (p.round) {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w / 2.4, (p.w / 2.4) * Math.max(0.25, sy), 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, (-p.h / 2) * Math.max(0.2, sy), p.w, p.h * Math.max(0.2, sy));
      }
      ctx.restore();
    }

    if (ps.length) {
      raf.current = requestAnimationFrame(loop);
    } else {
      raf.current = 0;
      last.current = 0;
      ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    }
  }, []);

  const fire = useCallback(
    (o: BurstOpts) => {
      const ps = parts.current;
      for (let i = 0; i < o.count; i++) {
        if (ps.length >= MAX_PARTICLES) ps.shift(); // tope para no ahogar la TV
        const a = ((o.angle + (Math.random() - 0.5) * o.spread) * Math.PI) / 180;
        const s = o.speed * (0.45 + Math.random() * 0.55);
        ps.push({
          x: o.x, y: o.y,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          w: 10 + Math.random() * 10, h: 6 + Math.random() * 8,
          rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 12,
          flip: Math.random() * Math.PI * 2, vf: 6 + Math.random() * 8,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          age: 0, max: 3.2 + Math.random() * 1.6, round: Math.random() < 0.2,
        });
      }
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    },
    [tick],
  );

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return { canvasRef, fire };
}

/* ───────────────────────────── Escala del escenario ───────────────────────────── */

function useStageScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / STAGE_W, height / STAGE_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
}

/* ───────────────────────────── Piezas visuales ───────────────────────────── */

const CHIP_STYLES: Record<number, { bg: string; fg: string; border: string }> = {
  1: { bg: BRAND.yellow, fg: BRAND.blue, border: BRAND.white },
  2: { bg: BRAND.white, fg: BRAND.blue, border: BRAND.blue },
  3: { bg: BRAND.red, fg: BRAND.white, border: BRAND.white },
};

function RankChip({ rank, size }: { rank: number; size: number }) {
  const s = CHIP_STYLES[rank] ?? { bg: BRAND.blue, fg: BRAND.white, border: BRAND.yellow };
  return (
    <span
      className="font-display absolute z-20 flex items-center justify-center rounded-full leading-none shadow-lg"
      style={{
        left: -size * 0.28, top: -size * 0.28, width: size, height: size,
        background: s.bg, color: s.fg, border: `4px solid ${s.border}`, fontSize: size * 0.46,
      }}
    >
      {rank}º
    </span>
  );
}

type Variant = "winner" | "podium" | "pack";

function PanCard({ result, rank, scale, variant }: { result: ArtistResult; rank: number; scale: number; variant: Variant }) {
  const chipSize = variant === "winner" ? 92 : variant === "podium" ? 72 : 54;
  return (
    <div className="relative" style={{ width: CARD_W * scale, height: CARD_H * scale }} data-stage={variant}>
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})` }}
      >
        <ArtistIdentityCard
          artist={result.artist}
          albumNumber={rank}
          className="!h-full !min-h-0 !w-full !max-w-none !rounded-[1.25rem] !shadow-none"
        />
      </div>
      <RankChip rank={rank} size={chipSize} />
      {variant === "pack" && (
        <span
          className="font-display absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-[20px] leading-tight text-white"
          style={{ bottom: -12, background: BRAND.blue, border: `2px solid ${BRAND.yellow}` }}
        >
          {result.totalPoints} pts
        </span>
      )}
    </div>
  );
}

function WinnerRing({ active, reduced }: { active: boolean; reduced: boolean | null }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute z-10"
      style={{ inset: -12, borderRadius: WINNER_RADIUS, border: `6px solid ${BRAND.yellow}` }}
      initial={{ boxShadow: "0 0 0 0 rgba(255,198,0,0)" }}
      animate={
        active && !reduced
          ? {
              boxShadow: [
                "0 0 36px 6px rgba(255,198,0,.55)",
                "0 0 96px 24px rgba(255,198,0,.9)",
                "0 0 36px 6px rgba(255,198,0,.55)",
              ],
            }
          : { boxShadow: active ? "0 0 40px 8px rgba(255,198,0,.6)" : "0 0 0 0 rgba(255,198,0,0)" }
      }
      transition={active && !reduced ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
    />
  );
}

type StepSpec = { scale: number; blockW: number; blockH: number; dx: number };

const BLOCK_LOOK: Record<number, { bg: string; fg: string; edge: string }> = {
  1: { bg: BRAND.yellow, fg: BRAND.blue, edge: BRAND.white },
  2: { bg: BRAND.white, fg: BRAND.blue, edge: BRAND.yellow },
  3: { bg: BRAND.red, fg: BRAND.white, edge: BRAND.yellow },
};

function PodiumStep({
  result, rank, spec, blockOn, cardOn, stamp = false, glowOn = false, reduced,
}: {
  result: ArtistResult; rank: 1 | 2 | 3; spec: StepSpec;
  blockOn: boolean; cardOn: boolean; stamp?: boolean; glowOn?: boolean; reduced: boolean | null;
}) {
  const cardH = CARD_H * spec.scale;
  const total = cardH + spec.blockH - OVERLAP;
  const look = BLOCK_LOOK[rank];
  const variant: Variant = stamp ? "winner" : "podium";
  const numSize = rank === 1 ? 84 : rank === 2 ? 56 : 44;
  const ptsSize = rank === 1 ? 40 : rank === 2 ? 30 : 26;

  return (
    <div
      className="absolute z-10 flex flex-col items-center"
      style={{ left: CX + spec.dx - spec.blockW / 2, top: BASELINE - total, width: spec.blockW, height: total }}
    >
      <motion.div
        className="relative z-10"
        style={{ marginBottom: -OVERLAP }}
        initial={stamp ? { opacity: 0, scale: 2.4 } : { opacity: 0, y: 170 }}
        animate={
          cardOn
            ? stamp ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }
            : stamp ? { opacity: 0, scale: 2.4 } : { opacity: 0, y: 170 }
        }
        transition={
          stamp
            ? { type: "spring", stiffness: 420, damping: 18, mass: 0.9 }
            : { type: "spring", stiffness: 240, damping: 22, delay: 0.08 }
        }
      >
        {stamp && <WinnerRing active={glowOn} reduced={reduced} />}
        <PanCard result={result} rank={rank} scale={spec.scale} variant={variant} />
      </motion.div>

      <motion.div
        className="flex w-full items-center justify-center gap-5 rounded-t-lg"
        style={{
          height: spec.blockH, background: look.bg, color: look.fg,
          borderTop: `8px solid ${look.edge}`, transformOrigin: "bottom",
          boxShadow: "inset 0 -30px 40px rgba(0,0,0,.12)",
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={blockOn ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <span className="font-display leading-none" style={{ fontSize: numSize }}>{rank}º</span>
        <span className="font-display leading-none" style={{ fontSize: ptsSize }}>{result.totalPoints} pts</span>
      </motion.div>
    </div>
  );
}

const restContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: TIMINGS.packStagger / 1000, delayChildren: 0.05 } },
};
const restItem: Variants = {
  hidden: { opacity: 0, y: 140, scale: 0.85 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

const CURTAIN_BG = `repeating-linear-gradient(90deg, ${BRAND.red} 0 60px, #A8121A 60px 92px, ${BRAND.red} 92px 150px)`;

/* ───────────────────────────── Componente principal ───────────────────────────── */

export function WinnerPodiumReveal({
  results,
  title = "Ranking de la noche",
  className = "absolute inset-0",
}: {
  results: ArtistResult[]; // ya ordenados: [0] = 1er lugar
  title?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { ref, scale } = useStageScale();
  const { canvasRef, fire } = useConfetti();
  const [phase, setPhase] = useState<Phase>("intro");
  const timers = useRef<number[]>([]);

  const runKey = results.map((r) => `${r.artist.id}:${r.totalPoints}`).join("|");
  const reached = (p: Phase) => PHASES.indexOf(phase) >= PHASES.indexOf(p);

  const [first, second, third] = results;
  const rest = results.slice(3);

  /* Línea de tiempo: avanza la fase a los ms definidos en TIMINGS */
  useEffect(() => {
    if (reduced) {
      setPhase("title");
      return;
    }
    setPhase("intro");
    const steps: [Phase, number][] = [
      ["pack", TIMINGS.packStart], ["third", TIMINGS.third], ["second", TIMINGS.second],
      ["base", TIMINGS.base], ["impact", TIMINGS.impact], ["title", TIMINGS.title],
    ];
    const ids = steps.map(([p, ms]) => window.setTimeout(() => setPhase(p), ms));
    return () => ids.forEach(window.clearTimeout);
  }, [runKey, reduced]);

  /* Confeti: suave al entrar, fuerte en el impacto (los timers viven en un ref para sobrevivir al cambio de fase) */
  useEffect(() => {
    if (reduced) return;
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    if (phase === "pack") {
      fire({ x: 100, y: -20, count: 34, angle: 65, spread: 50, speed: 700 });
      fire({ x: STAGE_W - 100, y: -20, count: 34, angle: 115, spread: 50, speed: 700 });
    }
    if (phase === "impact") {
      fire({ x: CX, y: 520, count: 150, angle: -90, spread: 150, speed: 1300 });
      fire({ x: 0, y: 980, count: 90, angle: -55, spread: 30, speed: 1500 });
      fire({ x: STAGE_W, y: 980, count: 90, angle: -125, spread: 30, speed: 1500 });
      later(350, () => {
        fire({ x: 0, y: 980, count: 60, angle: -60, spread: 30, speed: 1400 });
        fire({ x: STAGE_W, y: 980, count: 60, angle: -120, spread: 30, speed: 1400 });
      });
      for (let i = 0; i < 5; i++) {
        later(900 + i * 140, () =>
          fire({ x: 200 + Math.random() * (STAGE_W - 400), y: -20, count: 12, angle: 90, spread: 40, speed: 260 }),
        );
      }
    }
  }, [phase, reduced, fire]);

  useEffect(() => {
    const t = timers;
    return () => t.current.forEach(window.clearTimeout);
  }, [runKey]);

  if (!first) return null;

  const restScale = rest.length
    ? Math.min(0.44, Math.max(0.26, (REST_MAX_W - REST_GAP * (rest.length - 1)) / (rest.length * CARD_W)))
    : 0.44;
  const revealed = reached("title");
  const impacted = reached("impact");

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={ref}
        aria-label="Ranking de la noche"
        className={`${className} overflow-hidden`}
        style={{
          backgroundColor: BRAND.night,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.06) 2px, transparent 2.5px), radial-gradient(1200px 700px at 50% 40%, #1A3A82 0%, #0B1F52 55%, #050D26 100%)",
          backgroundSize: "28px 28px, auto",
        }}
      >
        {/* Lector de pantalla */}
        <p className="sr-only" aria-live="polite">
          {revealed
            ? `Ganador: ${first.artist.name}, ${first.totalPoints} puntos. Segundo: ${second?.artist.name ?? "—"}. Tercero: ${third?.artist.name ?? "—"}.`
            : "Revelando el ranking de la noche"}
        </p>

        {/* Escenario 1920×1080 escalado al tamaño real de la pantalla */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: STAGE_W, height: STAGE_H,
            transform: `translate(-50%, -50%) scale(${scale || 1})`,
            visibility: scale ? "visible" : "hidden",
          }}
        >
          <motion.div
            className="absolute inset-0"
            animate={impacted && !reduced ? { x: [0, -10, 9, -6, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {/* Reflector fijo + rayos que giran tras el impacto */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "radial-gradient(700px 520px at 50% 48%, rgba(255,255,255,.08), transparent 70%)" }}
            />
            <motion.div
              aria-hidden
              className="absolute will-change-transform"
              style={{
                width: 1600, height: 1600, left: CX - 800, top: 480 - 800,
                background: "repeating-conic-gradient(from 0deg, rgba(255,198,0,.17) 0deg 6deg, transparent 6deg 18deg)",
                WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 62%)",
                maskImage: "radial-gradient(circle, #000 0%, transparent 62%)",
              }}
              initial={{ opacity: 0 }}
              animate={impacted ? { opacity: 1, rotate: reduced ? 0 : 360 } : { opacity: 0 }}
              transition={{
                opacity: { duration: 0.8 },
                rotate: { duration: 70, repeat: Infinity, ease: "linear" },
              }}
            />

            {/* Título */}
            <div className="absolute inset-x-0 z-30 flex flex-col items-center text-center" style={{ top: 14, height: 150 }}>
              <AnimatePresence mode="wait">
                {!revealed ? (
                  <motion.div
                    key="ranking"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: reached("pack") ? 1 : 0, y: 0 }}
                    exit={{ opacity: 0, y: -30, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4 }}
                  >
                    <p className="font-hand leading-none" style={{ fontSize: 44, color: BRAND.yellow }}>
                      #TAVA · en el acto
                    </p>
                    <h1 className="font-display uppercase leading-none text-white" style={{ fontSize: 88, letterSpacing: "0.02em" }}>
                      {title}
                    </h1>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ganador"
                    initial={{ opacity: 0, scale: 1.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <p className="font-hand max-w-[1400px] truncate leading-none" style={{ fontSize: 44, color: BRAND.white }}>
                      ¡{first.artist.name}!
                    </p>
                    <h1
                      className="font-display uppercase leading-none"
                      style={{ fontSize: 108, color: BRAND.yellow, textShadow: `6px 6px 0 ${BRAND.red}` }}
                    >
                      Ganador
                    </h1>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Podio */}
            {third && (
              <PodiumStep
                result={third} rank={3} spec={THIRD}
                blockOn={reached("third")} cardOn={reached("third")} reduced={reduced}
              />
            )}
            {second && (
              <PodiumStep
                result={second} rank={2} spec={SECOND}
                blockOn={reached("second")} cardOn={reached("second")} reduced={reduced}
              />
            )}
            <PodiumStep
              result={first} rank={1} spec={WINNER} stamp
              blockOn={reached("base")} cardOn={impacted} glowOn={impacted} reduced={reduced}
            />

            {/* Resto del ranking (4º en adelante) */}
            {rest.length > 0 && (
              <motion.ul
                className="absolute inset-x-0 z-20 flex list-none justify-center p-0"
                style={{ top: REST_TOP, gap: REST_GAP }}
                variants={restContainer}
                initial="hidden"
                animate={reached("pack") ? "show" : "hidden"}
              >
                {rest.map((r, i) => (
                  <motion.li key={String(r.artist.id)} variants={restItem}>
                    <PanCard result={r} rank={i + 4} scale={restScale} variant="pack" />
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.div>

          {/* Confeti */}
          <canvas
            ref={canvasRef}
            width={STAGE_W}
            height={STAGE_H}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-40"
          />
        </div>

        {/* Flash blanco del impacto */}
        {impacted && !reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-50 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.35, times: [0, 0.25, 1] }}
          />
        )}

        {/* Telón de entrada */}
        {(["left", "right"] as const).map((side) => (
          <motion.div
            key={side}
            aria-hidden
            className="pointer-events-none absolute top-0 z-[60] h-full w-1/2"
            style={{ [side]: 0, background: CURTAIN_BG, boxShadow: "0 0 60px rgba(0,0,0,.45)" }}
            initial={{ x: 0 }}
            animate={{ x: side === "left" ? "-102%" : "102%" }}
            transition={{ delay: 0.1, duration: TIMINGS.curtain / 1000, ease: [0.7, 0, 0.3, 1] }}
          />
        ))}
      </section>
    </MotionConfig>
  );
}
