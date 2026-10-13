"use client";

/**
 * Wrappers del lobby: solo transform/opacity, sin blur de filtro.
 */

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const smooth = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: [0.45, 0.05, 0.55, 0.95] as const,
});

export function HeroText({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={`will-change-transform ${className}`}
      style={{ transform: "translateZ(0)" }}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: [0, -4, 0] }}
      transition={{
        opacity: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 6.5, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95], delay: 0.55 },
      }}
    >
      {children}
    </motion.div>
  );
}

export function PulseFrame({
  children,
  className = "",
  radiusClass = "rounded-2xl",
  color = "#FFC600",
}: {
  children: ReactNode;
  className?: string;
  radiusClass?: string;
  color?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={`relative will-change-transform ${className}`}
      style={{ transform: "translateZ(0)" }}
      animate={reduce ? undefined : { scale: [1, 1.012] }}
      transition={smooth(8)}
    >
      {!reduce &&
        [0, 3.2].map((delay) => (
          <motion.span
            key={delay}
            aria-hidden
            className={`pointer-events-none absolute -inset-2 border-4 will-change-transform ${radiusClass}`}
            style={{ borderColor: color, transform: "translateZ(0)" }}
            animate={{ opacity: [0.55, 0], scale: [1, 1.08] }}
            transition={{
              duration: 6.4,
              delay,
              repeat: Infinity,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

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
      className={`relative inline-block will-change-transform ${className}`}
      style={{
        transform: "translateZ(0)",
        textShadow: `0 0 22px ${glow}66`,
      }}
      animate={reduce ? undefined : { scale: [1, 1.018], opacity: [0.92, 1] }}
      transition={smooth(7)}
    >
      {children}
    </motion.span>
  );
}
