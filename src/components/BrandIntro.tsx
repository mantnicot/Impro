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

/** Overlay / bucle de marca */
export const BRAND_INTRO_MS = 3200;
/** Transición a votación: más corta */
export const BRAND_TRANSITION_MS = 2000;
export const BRAND_TRANSITION_MID_MS = 900;

export type BrandIntroSize = "corner" | "hero" | "stage" | "full";

const SIZE_STYLES: Record<
  BrandIntroSize,
  { title: string; ribbon: string; tag: string; pad: string; gap: string; border: string }
> = {
  corner: {
    title: "clamp(1.65rem, 4.5vw, 2.35rem)",
    ribbon: "clamp(0.55rem, 1.6vw, 0.75rem)",
    tag: "clamp(0.95rem, 2.4vw, 1.25rem)",
    pad: "px-0",
    gap: "mt-1.5",
    border: "border-2 px-2 py-0.5 shadow-[3px_3px_0_#0B1220]",
  },
  hero: {
    title: "clamp(3.25rem, 12vw, 5.5rem)",
    ribbon: "clamp(0.95rem, 3vw, 1.5rem)",
    tag: "clamp(1.5rem, 4.5vw, 2.4rem)",
    pad: "px-2",
    gap: "mt-3",
    border: "border-4 px-4 py-0.5 shadow-[6px_6px_0_#0B1220]",
  },
  stage: {
    title: "clamp(2.75rem, 9vw, 6rem)",
    ribbon: "clamp(1.1rem, 3.2vw, 2rem)",
    tag: "clamp(1.5rem, 3.8vw, 2.75rem)",
    pad: "px-4 sm:px-6",
    gap: "mt-3",
    border: "border-4 px-4 py-0.5 shadow-[8px_8px_0_#0B1220]",
  },
  full: {
    title: "clamp(4rem, 17vw, 13rem)",
    ribbon: "clamp(1.5rem, 5vw, 3.75rem)",
    tag: "clamp(2rem, 6vw, 4.5rem)",
    pad: "px-4 sm:px-6",
    gap: "mt-4",
    border: "border-4 px-6 py-1 shadow-[8px_8px_0_#0B1220]",
  },
};

type BrandIntroStageProps = {
  cycleKey: number;
  size?: BrandIntroSize;
  /** @deprecated usar size="stage" */
  compact?: boolean;
  /** Solo tipografía: sin gradiente, rayos ni flash. */
  lettersOnly?: boolean;
  /** Ritmo más corto (transición a votación). */
  pace?: "normal" | "fast";
  align?: "center" | "start";
  logo?: ReactNode;
  reduceMotion?: boolean | null;
};

/** Una pasada de la coreografía; remonta con cycleKey para repetir. */
export function BrandIntroStage({
  cycleKey,
  size,
  compact = false,
  lettersOnly = false,
  pace = "normal",
  align = "center",
  logo,
  reduceMotion,
}: BrandIntroStageProps) {
  const reduceHook = useReducedMotion();
  const reduce = reduceMotion ?? reduceHook;
  const resolved: BrandIntroSize = size ?? (compact ? "stage" : "full");
  const s = SIZE_STYLES[resolved];
  const slow = pace === "normal" && (resolved === "corner" || resolved === "hero");
  const fast = pace === "fast";

  const springSlow = {
    type: "spring" as const,
    stiffness: fast ? 200 : slow ? 70 : 90,
    damping: fast ? 16 : 18,
  };
  const dTitle = reduce ? 0 : fast ? 0.05 : slow ? 0.35 : 0.25;
  const dRibbon = reduce ? 0 : fast ? 0.25 : slow ? 1.4 : 1.1;
  const dTag = reduce ? 0 : fast ? 0.45 : slow ? 2.4 : 2;
  const dLine = reduce ? 0 : fast ? 0.55 : slow ? 2.9 : 2.4;

  return (
    <div
      key={cycleKey}
      className={`relative flex h-full w-full overflow-hidden ${
        align === "start" ? "items-start justify-start" : "items-center justify-center"
      }`}
    >
      {!lettersOnly && (
        <>
          <div className="bg-theater-gradient absolute inset-0" aria-hidden />
          <div className="bg-halftone-dots absolute inset-0 opacity-50" aria-hidden />
        </>
      )}

      <div
        className={`relative z-10 flex flex-col text-center ${s.pad} ${
          align === "start" ? "items-start" : "items-center"
        }`}
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.55, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ ...springSlow, delay: dTitle }}
        >
          {logo ?? (
            <span
              className="font-display block leading-none text-white"
              style={{
                fontSize: s.title,
                textShadow: "0.06em 0.06em 0 #D61A21",
                letterSpacing: "0.02em",
              }}
            >
              TAVA
            </span>
          )}
        </motion.div>

        <motion.div
          className={`-skew-x-6 border-[#FFC600] bg-[#D61A21] ${s.gap} ${s.border}`}
          initial={reduce ? false : { opacity: 0, y: slow ? 24 : 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSlow, delay: dRibbon }}
        >
          <span
            className="font-display block uppercase leading-tight text-white"
            style={{ fontSize: s.ribbon, letterSpacing: "0.12em" }}
          >
            En el acto
          </span>
        </motion.div>

        <motion.div
          className={`relative ${s.gap}`}
          initial={reduce ? false : { opacity: 0, rotate: -6, y: 12 }}
          animate={{ opacity: 1, rotate: -3, y: 0 }}
          transition={{
            duration: fast ? 0.45 : slow ? 1.35 : 1.1,
            ease: "easeOut",
            delay: dTag,
          }}
        >
          <span className="font-hand block text-[#FFC600]" style={{ fontSize: s.tag }}>
            #TAVA
          </span>
          <svg
            aria-hidden
            viewBox="0 0 200 14"
            className={`absolute left-0 w-full ${resolved === "corner" ? "-bottom-1 h-2" : "-bottom-2 h-3"}`}
            preserveAspectRatio="none"
          >
            <motion.path
              d="M2 9 C 40 2, 80 14, 120 6 S 178 4, 198 8"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={resolved === "corner" ? 3 : 4}
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: fast ? 0.5 : slow ? 1.5 : 1.2,
                ease: "easeOut",
                delay: dLine,
              }}
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

/** Bucle continuo: solo letras. Sin remount (más fluido). */
export function BrandIntroLoop({
  className = "",
  size = "stage",
  align = "center",
  logo,
}: {
  className?: string;
  size?: BrandIntroSize;
  align?: "center" | "start";
  logo?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const s = SIZE_STYLES[size];

  return (
    <motion.div
      className={`relative isolate overflow-visible will-change-transform ${className}`}
      style={{ transform: "translateZ(0)" }}
      aria-hidden
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.94 }}
      animate={
        reduce
          ? { opacity: 1, y: 0, scale: 1 }
          : {
              opacity: 1,
              y: [0, -5, 0],
              scale: [1, 1.025, 1],
              rotate: [-1.2, 0.8, -1.2],
            }
      }
      transition={
        reduce
          ? { duration: 0.25 }
          : {
              opacity: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
              y: { duration: 5.5, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95] },
              scale: { duration: 5.5, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95] },
              rotate: { duration: 7.5, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95] },
            }
      }
    >
      <div
        className={`relative z-10 flex h-full w-full flex-col text-center ${s.pad} ${
          align === "start" ? "items-start justify-start" : "items-center justify-center"
        }`}
      >
        {logo ?? (
          <span
            className="font-display block leading-none text-white"
            style={{
              fontSize: s.title,
              textShadow: "0.06em 0.06em 0 #D61A21",
              letterSpacing: "0.02em",
            }}
          >
            TAVA
          </span>
        )}
        <div className={`-skew-x-6 border-[#FFC600] bg-[#D61A21] ${s.gap} ${s.border}`}>
          <span
            className="font-display block uppercase leading-tight text-white"
            style={{ fontSize: s.ribbon, letterSpacing: "0.12em" }}
          >
            En el acto
          </span>
        </div>
        <div className={`relative ${s.gap}`}>
          <span className="font-hand block text-[#FFC600]" style={{ fontSize: s.tag }}>
            #TAVA
          </span>
          <svg
            aria-hidden
            viewBox="0 0 200 14"
            className={`absolute left-0 w-full ${size === "corner" ? "-bottom-1 h-2" : "-bottom-2 h-3"}`}
            preserveAspectRatio="none"
          >
            <path
              d="M2 9 C 40 2, 80 14, 120 6 S 178 4, 198 8"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={size === "corner" ? 3 : 4}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </motion.div>
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
  const duration = reduce ? 700 : BRAND_TRANSITION_MS;
  const mid = reduce ? 300 : BRAND_TRANSITION_MID_MS;

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
          <BrandIntroStage
            cycleKey={playKey}
            lettersOnly
            pace="fast"
            reduceMotion={reduce}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
