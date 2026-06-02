"use client";

import { motion } from "framer-motion";

export function TheaterLights() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-spotlight" />
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-tava-purple/40"
          style={{ left: `${8 + i * 8}%`, top: "2%" }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 1.5 + (i % 3) * 0.5,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}
