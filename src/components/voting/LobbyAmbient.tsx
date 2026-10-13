"use client";

/**
 * Wrappers mínimos para el lobby del proyector. No cambian el contenido:
 * solo lo envuelven para darle vida. Todo con transform/opacity.
 *
 *   <HeroText>…ESCANEEN EL QR…</HeroText>   entrada punchy + flotación lenta
 *   <PulseFrame>…QR…</PulseFrame>            respira + aros amarillos que se expanden
 *   <GlowText>{code}</GlowText>              halo amarillo que pulsa (sin cambiar el ancho)
 *
 * prefers-reduced-motion: se renderizan quietos.
 */

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const mirror = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: "easeInOut" as const,
});

/* ───────────── HeroText: "ESCANEEN EL QR" ───────────── */

export function HeroText({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 48, scale: 0.9, rotate: -2 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* idle: flota apenas, muy lento */}
      <motion.div
        className="will-change-transform"
        animate={{ y: [0, -4], rotate: [0, 0.4] }}
        transition={mirror(14, 1.2)}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ───────────── PulseFrame: marco del QR ───────────── */

export function PulseFrame({
  children,
  className = "",
  radiusClass = "rounded-2xl",
  color = "#FFC600",
}: {
  children: ReactNode;
  className?: string;
  /** Radio del contenedor, para que los aros coincidan con tu marco. */
  radiusClass?: string;
  color?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={`relative ${className}`}
      animate={reduce ? undefined : { scale: [1, 1.015] }}
      transition={mirror(11)}
    >
      {!reduce &&
        [0, 4].map((delay) => (
          <motion.span
            key={delay}
            aria-hidden
            className={`pointer-events-none absolute -inset-2 border-4 will-change-transform ${radiusClass}`}
            style={{ borderColor: color }}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0.65, 0], scale: [1, 1.1] }}
            transition={{ duration: 8, delay, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ───────────── GlowText: código de sala ───────────── */

export function GlowText({
  children,
  className = "",
  glow = "#FFC600",
}: {
  children: string;
  className?: string;
  glow?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.span
      className={`relative inline-block ${className}`}
      animate={reduce ? undefined : { scale: [1, 1.012] }}
      transition={mirror(10)}
    >
      {/* copia desenfocada: solo cambia su opacidad (barato en GPU) */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none blur-md"
        style={{ color: glow, opacity: reduce ? 0.35 : 0.25 }}
        animate={reduce ? undefined : { opacity: [0.22, 0.7] }}
        transition={mirror(10)}
      >
        {children}
      </motion.span>
      <span className="relative">{children}</span>
    </motion.span>
  );
}
