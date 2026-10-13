"use client";

import { motion, useReducedMotion } from "framer-motion";

export function TheaterLights() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-spotlight" />
      {!reduce &&
        [...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-tava-yellow/50 will-change-transform"
            style={{ left: `${10 + i * 10}%`, top: "2.5%", transform: "translateZ(0)" }}
            animate={{ opacity: [0.2, 0.75, 0.2], scale: [0.85, 1.15, 0.85] }}
            transition={{
              duration: 2.8 + (i % 3) * 0.6,
              repeat: Infinity,
              delay: i * 0.2,
              ease: [0.45, 0.05, 0.55, 0.95],
            }}
          />
        ))}
    </div>
  );
}
