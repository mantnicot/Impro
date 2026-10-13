"use client";

/**
 * Marca TAVA:
 * - BrandIntroLoop: letras flotando (esquina / join)
 * - BrandIntroTransition: overlay al pasar a votación
 */

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export const BRAND_TRANSITION_MS = 2000;
export const BRAND_TRANSITION_MID_MS = 900;

export type BrandIntroSize = "corner" | "hero" | "stage";

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
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_SOFT = [0.45, 0.05, 0.55, 0.95] as const;

function BrandMark({
  size,
  align = "center",
  logo,
}: {
  size: BrandIntroSize;
  align?: "center" | "start";
  logo?: ReactNode;
}) {
  const s = SIZE_STYLES[size];
  return (
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
  );
}

/** Coreografía one-shot (transición a votación). */
function BrandIntroStage({
  playKey,
  reduce,
}: {
  playKey: number;
  reduce: boolean | null;
}) {
  const title =
    "clamp(4rem, 17vw, 13rem)";
  const ribbon = "clamp(1.5rem, 5vw, 3.75rem)";
  const tag = "clamp(2rem, 6vw, 4.5rem)";

  return (
    <div
      key={playKey}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
    >
      <div className="relative z-10 flex flex-col items-center px-4 text-center sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.55, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ type: "spring", stiffness: 200, damping: 16, delay: reduce ? 0 : 0.05 }}
        >
          <span
            className="font-display block leading-none text-white"
            style={{
              fontSize: title,
              textShadow: "0.06em 0.06em 0 #D61A21",
              letterSpacing: "0.02em",
            }}
          >
            TAVA
          </span>
        </motion.div>

        <motion.div
          className="mt-4 -skew-x-6 border-4 border-[#FFC600] bg-[#D61A21] px-6 py-1 shadow-[8px_8px_0_#0B1220]"
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 16, delay: reduce ? 0 : 0.25 }}
        >
          <span
            className="font-display block uppercase leading-tight text-white"
            style={{ fontSize: ribbon, letterSpacing: "0.12em" }}
          >
            En el acto
          </span>
        </motion.div>

        <motion.div
          className="relative mt-5"
          initial={reduce ? false : { opacity: 0, rotate: -6, y: 12 }}
          animate={{ opacity: 1, rotate: -3, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: reduce ? 0 : 0.45 }}
        >
          <span className="font-hand block text-[#FFC600]" style={{ fontSize: tag }}>
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
              transition={{ duration: 0.5, ease: "easeOut", delay: reduce ? 0 : 0.55 }}
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

/** Bucle continuo: solo letras. Sin remount. */
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
              opacity: { duration: 0.55, ease: EASE_OUT },
              y: { duration: 5.5, repeat: Infinity, ease: EASE_SOFT },
              scale: { duration: 5.5, repeat: Infinity, ease: EASE_SOFT },
              rotate: { duration: 7.5, repeat: Infinity, ease: EASE_SOFT },
            }
      }
    >
      <BrandMark size={size} align={align} logo={logo} />
    </motion.div>
  );
}

/** Transición a votación: letras TAVA, sin fondo opaco. */
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
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <BrandIntroStage playKey={playKey} reduce={reduce} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
