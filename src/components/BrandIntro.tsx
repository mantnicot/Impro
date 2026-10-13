"use client";

/**
 * BrandIntro — marca TAVA:
 * - overlay: fullscreen al ingresar (saltable)
 * - loop: solo letras, sin caja ni fondo (lobby)
 * - transition: solo letras sobre el fondo animado (sin telón opaco)
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

/** Transiciones más lentas a propósito */
export const BRAND_INTRO_MS = 4800;
export const BRAND_INTRO_MID_MS = 2200;
export const BRAND_INTRO_LOOP_GAP_MS = 1200;

type BrandIntroStageProps = {
  cycleKey: number;
  compact?: boolean;
  /** Solo tipografía: sin gradiente, rayos ni flash. */
  lettersOnly?: boolean;
  logo?: ReactNode;
  reduceMotion?: boolean | null;
};

/** Una pasada de la coreografía; remonta con cycleKey para repetir. */
export function BrandIntroStage({
  cycleKey,
  compact = false,
  lettersOnly = false,
  logo,
  reduceMotion,
}: BrandIntroStageProps) {
  const reduceHook = useReducedMotion();
  const reduce = reduceMotion ?? reduceHook;
  const titleSize = compact
    ? "clamp(2.75rem, 9vw, 6rem)"
    : "clamp(4rem, 17vw, 13rem)";
  const ribbonSize = compact
    ? "clamp(1.1rem, 3.2vw, 2rem)"
    : "clamp(1.5rem, 5vw, 3.75rem)";
  const tagSize = compact
    ? "clamp(1.5rem, 3.8vw, 2.75rem)"
    : "clamp(2rem, 6vw, 4.5rem)";

  const springSlow = {
    type: "spring" as const,
    stiffness: 90,
    damping: 18,
  };

  return (
    <div
      key={cycleKey}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
    >
      {!lettersOnly && (
        <>
          <div className="bg-theater-gradient absolute inset-0" aria-hidden />
          <div className="bg-halftone-dots absolute inset-0 opacity-50" aria-hidden />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center px-4 text-center sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.55, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ ...springSlow, delay: reduce ? 0 : 0.25 }}
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
          className={`-skew-x-6 border-4 border-[#FFC600] bg-[#D61A21] shadow-[8px_8px_0_#0B1220] ${
            compact ? "mt-3 px-4 py-0.5" : "mt-4 px-6 py-1"
          }`}
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSlow, delay: reduce ? 0 : 1.1 }}
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
          transition={{ duration: 1.1, ease: "easeOut", delay: reduce ? 0 : 2 }}
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
              transition={{ duration: 1.2, ease: "easeOut", delay: reduce ? 0 : 2.4 }}
            />
          </svg>
        </motion.div>
      </div>
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
      transition={{ duration: reduce ? 0.2 : 0.45, ease: "easeOut" }}
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

/** Bucle continuo: solo letras, sin caja ni fondo propio. */
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
    <div className={`relative isolate overflow-visible ${className}`} aria-hidden>
      <BrandIntroStage
        cycleKey={cycle}
        compact
        lettersOnly
        logo={logo}
        reduceMotion={reduce}
      />
    </div>
  );
}

/** Transición de escena: letras TAVA lentas, sin telón opaco. */
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
          className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <BrandIntroStage cycleKey={playKey} lettersOnly reduceMotion={reduce} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
