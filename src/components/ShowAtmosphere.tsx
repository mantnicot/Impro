"use client";

/**
 * ShowAtmosphere — fondo "siempre vivo" para las escenas del proyector.
 *
 * Capas (todas con transform/opacity, sin tocar layout):
 *   1. base `bg-theater-gradient` (ya existe en tu tailwind)
 *   2. halftone `bg-halftone-dots` a la deriva lenta
 *   3. dos haces de spotlight que barren despacio
 *   4. puntos que suben (rojo / amarillo / blanco)
 *   5. viñeta
 *
 * Uso: primer hijo de un contenedor `relative isolate overflow-hidden`;
 * el contenido real va en `relative z-10`. No captura clics.
 * Con prefers-reduced-motion: mismas capas, quietas (sin loops).
 */

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

export type AtmosphereVariant = "lobby" | "general";

type Props = {
  variant?: AtmosphereVariant;
  className?: string;
};

const DOT_COLORS = ["#FFC600", "#FFFFFF", "#D61A21", "#FFC600"];

// PRNG determinista: servidor y cliente generan los mismos puntos (sin hydration mismatch)
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
    size: Math.round(6 + rnd() * 14),
    color: DOT_COLORS[Math.floor(rnd() * DOT_COLORS.length)],
    ring: rnd() < 0.3, // algunos son aro, como puntos de impresión comic
    duration: Number((9 + rnd() * 9).toFixed(2)),
    delay: Number((rnd() * 8).toFixed(2)),
    peak: Number((0.45 + rnd() * 0.4).toFixed(2)),
  }));
}

const mirror = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: "easeInOut" as const,
});

export default function ShowAtmosphere({ variant = "lobby", className = "" }: Props) {
  const reduce = useReducedMotion();
  const lobby = variant === "lobby";
  const dots = useMemo(() => makeDots(lobby ? 20 : 10, lobby ? 7 : 11), [lobby]);

  // Haz simétrico: no hace falta espejarlo, solo barrer en sentido contrario
  const beam = {
    clipPath: "polygon(47% 0, 53% 0, 100% 100%, 0 100%)",
    background:
      "linear-gradient(to bottom, rgba(255,236,160,.32), rgba(255,236,160,.07) 62%, transparent)",
    filter: "blur(5px)",
    opacity: lobby ? 1 : 0.6,
  };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-theater-gradient ${className}`}
    >
      {/* Halftone a la deriva (ida y vuelta, sin costura) */}
      <motion.div
        className="bg-halftone-dots absolute -inset-[8%] will-change-transform"
        style={{ opacity: lobby ? 0.55 : 0.4 }}
        animate={reduce ? undefined : { x: [0, 28], y: [0, -28] }}
        transition={mirror(14)}
      />

      {/* Spotlight: dos haces que barren despacio */}
      <motion.div
        className="absolute left-[8%] top-[-10%] h-[125%] w-[36%] origin-top will-change-transform"
        style={beam}
        initial={{ rotate: -10 }}
        animate={reduce ? undefined : { rotate: [-14, 10] }}
        transition={mirror(9)}
      />
      <motion.div
        className="absolute right-[8%] top-[-10%] h-[125%] w-[36%] origin-top will-change-transform"
        style={beam}
        initial={{ rotate: 10 }}
        animate={reduce ? undefined : { rotate: [14, -10] }}
        transition={mirror(11, 1.2)}
      />

      {/* Puntos que suben */}
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full will-change-transform"
          style={{
            left: `${d.left}%`,
            top: "100%",
            width: d.size,
            height: d.size,
            background: d.ring ? "transparent" : d.color,
            border: d.ring ? `3px solid ${d.color}` : undefined,
            opacity: reduce ? 0.25 : 0,
          }}
          animate={
            reduce
              ? undefined
              : { y: [0, "-105vh"], opacity: [0, d.peak, d.peak, 0] }
          }
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.15, 0.8, 1],
          }}
        />
      ))}

      {/* Viñeta (respira apenas) */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent ${lobby ? 48 : 42}%, rgba(5,10,25,${lobby ? 0.7 : 0.82}) 100%)`,
        }}
        animate={reduce ? undefined : { opacity: [0.85, 1] }}
        transition={mirror(8)}
      />
    </div>
  );
}
