"use client";

/**
 * BrandIntro — marca TAVA en 3 modos:
 * - overlay: fullscreen al ingresar (siempre, saltable)
 * - loop: embutido, se repite (lobby izquierda)
 * - transition: overlay de cambio de escena (votación), API tipo telón
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** Coreografía lenta (lobby loop / ingreso / transición a votación). */
export const BRAND_INTRO_MS = 7200;
export const BRAND_INTRO_MID_MS = 3400;
export const BRAND_INTRO_LOOP_GAP_MS = 1800;

const BURST = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const radius = 26 + (i % 3) * 9;
  return {
    id: i,
    x: Math.round(Math.cos(angle) * radius * 10) / 10,
    y: Math.round(Math.sin(angle) * radius * 10) / 10,
    size: 10 + (i % 4) * 6,
    color: i % 3 === 0 ? "#D61A21" : i % 3 === 1 ? "#FFC600" : "#FFFFFF",
  };
});

type BrandIntroStageProps = {
  cycleKey: number;
  compact?: boolean;
  logo?: ReactNode;
  reduceMotion?: boolean | null;
};

/** Una pasada de la coreografía; remonta con cycleKey para repetir. */
export function BrandIntroStage({
  cycleKey,
  compact = false,
  logo,
  reduceMotion,
}: BrandIntroStageProps) {
  const reduceHook = useReducedMotion();
  const reduce = reduceMotion ?? reduceHook;
  const titleSize = compact
    ? "clamp(2.5rem, 8vw, 5.5rem)"
    : "clamp(4rem, 17vw, 13rem)";
  const ribbonSize = compact
    ? "clamp(1rem, 3vw, 1.75rem)"
    : "clamp(1.5rem, 5vw, 3.75rem)";
  const tagSize = compact
    ? "clamp(1.35rem, 3.5vw, 2.5rem)"
    : "clamp(2rem, 6vw, 4.5rem)";

  return (
    <div key={cycleKey} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="bg-theater-gradient absolute inset-0" aria-hidden />
      <div className="bg-halftone-dots absolute inset-0 opacity-50" aria-hidden />

      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[190vmax] w-[190vmax] will-change-transform"
            style={{
              marginLeft: "-95vmax",
              marginTop: "-95vmax",
              background:
                "repeating-conic-gradient(from 0deg, rgba(255,198,0,.16) 0deg 7deg, transparent 7deg 20deg)",
              WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 55%)",
              maskImage: "radial-gradient(circle, #000 0%, transparent 55%)",
            }}
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: [0.35, 0.85, 0.55], scale: [0.85, 1.05, 1], rotate: [-8, 6, 2] }}
            transition={{ duration: 6.5, ease: "easeInOut", times: [0, 0.55, 1] }}
          />

          {BURST.map((d) => (
            <motion.span
              key={d.id}
              aria-hidden
              className="absolute left-1/2 top-1/2 rounded-full will-change-transform"
              style={{
                width: compact ? d.size * 0.55 : d.size,
                height: compact ? d.size * 0.55 : d.size,
                background: d.color,
                marginLeft: -(compact ? d.size * 0.55 : d.size) / 2,
                marginTop: -(compact ? d.size * 0.55 : d.size) / 2,
              }}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
              animate={{
                opacity: [0, 0.75, 0],
                x: `${compact ? d.x * 0.55 : d.x}vmin`,
                y: `${compact ? d.y * 0.55 : d.y}vmin`,
                scale: 1,
              }}
              transition={{ duration: 3.2, delay: 1.2 + (d.id % 4) * 0.15, ease: "easeOut", times: [0, 0.35, 1] }}
            />
          ))}
        </>
      )}

      <div className="relative z-10 flex flex-col items-center px-4 text-center sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.45, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : 0.4 }}
        >
          {logo ?? (
            <span
              className="font-display block leading-none text-white"
              style={{
                fontSize: titleSize,
                textShadow: "0.06em 0.06em 0 #D61A21",
                letterSpacing: "0.02em",
              }}
            >
              TAVA
            </span>
          )}
        </motion.div>

        <motion.div
          className={`mt-3 -skew-x-6 border-4 border-[#FFC600] bg-[#D61A21] shadow-[8px_8px_0_#0B1220] ${
            compact ? "px-4 py-0.5" : "mt-4 px-6 py-1"
          }`}
          initial={reduce ? false : { opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : 1.6 }}
        >
          <span
            className="font-display block uppercase leading-tight text-white"
            style={{ fontSize: ribbonSize, letterSpacing: "0.12em" }}
          >
            En el acto
          </span>
        </motion.div>

        <motion.div
          className={`relative ${compact ? "mt-3" : "mt-5"}`}
          initial={reduce ? false : { opacity: 0, rotate: -6, y: 12 }}
          animate={{ opacity: 1, rotate: -3, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: reduce ? 0 : 2.6 }}
        >
          <span className="font-hand block text-[#FFC600]" style={{ fontSize: tagSize }}>
            #TAVA
          </span>
          <svg
            aria-hidden
            viewBox="0 0 200 14"
            className="absolute -bottom-2 left-0 h-3 w-full"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M2 9 C 40 2, 80 14, 120 6 S 178 4, 198 8"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, ease: "easeOut", delay: reduce ? 0 : 3.1 }}
            />
          </svg>
        </motion.div>
      </div>

      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#FFC600]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.45, 0] }}
          transition={{ duration: 1.1, delay: 1.1, times: [0, 0.35, 1] }}
        />
      )}
    </div>
  );
}

type OverlayProps = {
  logo?: ReactNode;
  onDone?: () => void;
};

/** Fullscreen al entrar: siempre se muestra; se salta con tap/tecla. */
export default function BrandIntro({ logo, onDone }: OverlayProps) {
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);

  const leave = useCallback(() => {
    setLeaving(true);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(leave, reduce ? 900 : BRAND_INTRO_MS);
    return () => window.clearTimeout(t);
  }, [reduce, leave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") leave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leave]);

  if (done) return null;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      leave();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label="Saltar intro de TAVA"
      onClick={leave}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-[#0B1220] outline-none"
      style={{ pointerEvents: leaving ? "none" : "auto" }}
      initial={false}
      animate={leaving ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
      transition={{ duration: reduce ? 0.2 : 0.35, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (leaving) {
          setDone(true);
          onDone?.();
        }
      }}
    >
      <BrandIntroStage cycleKey={0} logo={logo} reduceMotion={reduce} />
      <span className="sr-only">Toca o presiona una tecla para saltar la intro</span>
    </motion.div>
  );
}

/** Bucle continuo para el lobby (columna izquierda). */
export function BrandIntroLoop({
  className = "",
  logo,
}: {
  className?: string;
  logo?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(
      () => setCycle((c) => c + 1),
      BRAND_INTRO_MS + BRAND_INTRO_LOOP_GAP_MS
    );
    return () => window.clearInterval(t);
  }, [reduce]);

  return (
    <div
      className={`relative isolate overflow-hidden rounded-[2rem] border-4 border-tava-yellow bg-[#0B1220] shadow-[12px_12px_0_rgba(11,18,32,0.35)] ${className}`}
      aria-hidden
    >
      <BrandIntroStage cycleKey={cycle} compact logo={logo} reduceMotion={reduce} />
    </div>
  );
}

/** Transición de escena (votación): misma API que TelonTransition. */
export function BrandIntroTransition({
  playKey,
  playing = true,
  onMidpoint,
  onComplete,
}: {
  playKey: number;
  playing?: boolean;
  onMidpoint: () => void;
  onComplete: () => void;
}) {
  const reduce = useReducedMotion();
  const midFired = useRef(false);
  const completeFired = useRef(false);
  const active = playKey > 0 && playing;
  const duration = reduce ? 900 : BRAND_INTRO_MS;
  const mid = reduce ? 400 : BRAND_INTRO_MID_MS;

  useEffect(() => {
    if (!active) return;
    midFired.current = false;
    completeFired.current = false;

    const midTimer = window.setTimeout(() => {
      if (midFired.current) return;
      midFired.current = true;
      onMidpoint();
    }, mid);

    const doneTimer = window.setTimeout(() => {
      if (completeFired.current) return;
      completeFired.current = true;
      if (!midFired.current) {
        midFired.current = true;
        onMidpoint();
      }
      onComplete();
    }, duration);

    return () => {
      window.clearTimeout(midTimer);
      window.clearTimeout(doneTimer);
    };
  }, [playKey, active, onMidpoint, onComplete, duration, mid]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={playKey}
          className="pointer-events-none fixed inset-0 z-[90] overflow-hidden bg-[#0B1220]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <BrandIntroStage cycleKey={playKey} reduceMotion={reduce} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
