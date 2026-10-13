"use client";

/**
 * ShowAtmosphere — fondo vivo del proyector.
 * Solo transform/opacity, sin blur de filtro (más fluido en TV/móviles).
 */

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

export type AtmosphereVariant = "lobby" | "general";

type Props = {
  variant?: AtmosphereVariant;
  className?: string;
};

const DOT_COLORS = ["#FFC600", "#FFFFFF", "#D61A21"];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeDots(count: number, seed: number) {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Number((rnd() * 100).toFixed(2)),
    size: Math.round(5 + rnd() * 10),
    color: DOT_COLORS[Math.floor(rnd() * DOT_COLORS.length)]!,
    ring: rnd() < 0.25,
    duration: Number((16 + rnd() * 12).toFixed(2)),
    delay: Number((rnd() * 10).toFixed(2)),
    peak: Number((0.35 + rnd() * 0.35).toFixed(2)),
  }));
}

const smooth = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: [0.45, 0.05, 0.55, 0.95] as const,
});

export default function ShowAtmosphere({ variant = "lobby", className = "" }: Props) {
  const reduce = useReducedMotion();
  const lobby = variant === "lobby";
  const dots = useMemo(() => makeDots(lobby ? 8 : 5, lobby ? 7 : 11), [lobby]);

  const beamStyle = {
    clipPath: "polygon(48% 0, 52% 0, 100% 100%, 0 100%)",
    background:
      "linear-gradient(to bottom, rgba(255,236,160,.28), rgba(255,236,160,.06) 55%, transparent)",
    opacity: lobby ? 0.9 : 0.55,
  };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-theater-gradient ${className}`}
    >
      <motion.div
        className="bg-halftone-dots absolute -inset-[6%] will-change-transform"
        style={{ opacity: lobby ? 0.45 : 0.32, transform: "translateZ(0)" }}
        animate={reduce ? undefined : { x: [0, 18], y: [0, -16] }}
        transition={smooth(28)}
      />

      <motion.div
        className="absolute left-[10%] top-[-8%] h-[120%] w-[34%] origin-top will-change-transform"
        style={{ ...beamStyle, transform: "translateZ(0)" }}
        animate={reduce ? undefined : { rotate: [-11, 7] }}
        transition={smooth(24)}
      />
      <motion.div
        className="absolute right-[10%] top-[-8%] h-[120%] w-[34%] origin-top will-change-transform"
        style={{ ...beamStyle, transform: "translateZ(0)" }}
        animate={reduce ? undefined : { rotate: [11, -7] }}
        transition={smooth(28, 1.5)}
      />

      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full will-change-transform"
          style={{
            left: `${d.left}%`,
            bottom: "-2%",
            width: d.size,
            height: d.size,
            background: d.ring ? "transparent" : d.color,
            border: d.ring ? `2px solid ${d.color}` : undefined,
            opacity: reduce ? 0.2 : 0,
            transform: "translateZ(0)",
          }}
          animate={
            reduce
              ? undefined
              : { y: [0, "-110vh"], opacity: [0, d.peak, d.peak, 0] }
          }
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.12, 0.82, 1],
          }}
        />
      ))}

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent ${lobby ? 58 : 52}%, rgba(5,10,25,${lobby ? 0.22 : 0.3}) 100%)`,
        }}
      />
    </div>
  );
}
