"use client";

/**
 * Telón cerrado de fondo (lobby / espera del show).
 * Dos paneles rojos con pliegues, borde dorado y respiración muy lenta.
 */

import { motion, useReducedMotion } from "framer-motion";

function CurtainPanel({ side }: { side: "left" | "right" }) {
  const folds = Array.from({ length: 7 }, (_, i) => i);
  const isLeft = side === "left";

  return (
    <div
      className={`absolute top-0 h-full w-[52%] overflow-hidden ${isLeft ? "left-0" : "right-0"}`}
      style={{
        background: isLeft
          ? "linear-gradient(90deg, #8B1014 0%, #D61A21 18%, #B31418 42%, #F03A40 58%, #8B1014 100%)"
          : "linear-gradient(270deg, #8B1014 0%, #D61A21 18%, #B31418 42%, #F03A40 58%, #8B1014 100%)",
        boxShadow: isLeft
          ? "inset -18px 0 40px rgba(0,0,0,0.45)"
          : "inset 18px 0 40px rgba(0,0,0,0.45)",
      }}
    >
      {folds.map((i) => (
        <div
          key={i}
          className="absolute inset-y-0 w-[14%]"
          style={{
            left: `${i * 14}%`,
            background:
              i % 2 === 0
                ? "linear-gradient(90deg, rgba(0,0,0,0.28), transparent 55%)"
                : "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 40%, transparent)",
          }}
        />
      ))}
      {/* Borde interior hacia el centro */}
      <div
        className={`absolute inset-y-0 w-3 ${isLeft ? "right-0" : "left-0"}`}
        style={{
          background: "linear-gradient(180deg, #FFD84D, #FFC600 40%, #B8860B 100%)",
          opacity: 0.85,
        }}
      />
    </div>
  );
}

export default function ClosedCurtain({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#0B1220] ${className}`}
    >
      {/* Valance superior */}
      <div
        className="absolute inset-x-0 top-0 z-20 h-10 sm:h-14"
        style={{
          background:
            "linear-gradient(180deg, #8B1014 0%, #D61A21 55%, #6E0C10 100%)",
          boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-2"
          style={{ background: "linear-gradient(90deg, #B8860B, #FFC600, #B8860B)" }}
        />
      </div>

      <motion.div
        className="absolute inset-0 origin-top"
        animate={reduce ? undefined : { scaleY: [1, 1.012], y: [0, 4] }}
        transition={{
          duration: 14,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        <CurtainPanel side="left" />
        <CurtainPanel side="right" />
      </motion.div>

      {/* Solape central oscuro (telón cerrado) */}
      <div
        className="absolute left-1/2 top-0 z-10 h-full w-8 -translate-x-1/2 sm:w-12"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(11,18,32,0.75) 35%, rgba(11,18,32,0.9) 50%, rgba(11,18,32,0.75) 65%, transparent)",
        }}
      />

      {/* Viñeta suave para legibilidad del contenido */}
      <div
        className="absolute inset-0 z-30"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(11,18,32,0.35) 0%, rgba(11,18,32,0.72) 100%)",
        }}
      />
    </div>
  );
}
