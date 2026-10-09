"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Telón de ~2s. No depende de Lottie (más fiable en proyector). */
const DURATION_MS = 2000;
const MIDPOINT_MS = 900;

interface TelonTransitionProps {
  playKey: number;
  onMidpoint: () => void;
  onComplete: () => void;
}

export function TelonTransition({ playKey, onMidpoint, onComplete }: TelonTransitionProps) {
  const midFired = useRef(false);
  const completeFired = useRef(false);
  const active = playKey > 0;

  useEffect(() => {
    if (!active) return;
    midFired.current = false;
    completeFired.current = false;

    const mid = window.setTimeout(() => {
      if (midFired.current) return;
      midFired.current = true;
      onMidpoint();
    }, MIDPOINT_MS);

    const done = window.setTimeout(() => {
      if (completeFired.current) return;
      completeFired.current = true;
      if (!midFired.current) {
        midFired.current = true;
        onMidpoint();
      }
      onComplete();
    }, DURATION_MS);

    return () => {
      window.clearTimeout(mid);
      window.clearTimeout(done);
    };
  }, [playKey, active, onMidpoint, onComplete]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={playKey}
          className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Franjas diagonales: amarillo → rojo → azul */}
          <motion.div
            className="absolute -inset-[40%] origin-center bg-tava-yellow"
            style={{ rotate: "-22deg" }}
            initial={{ x: "-120%" }}
            animate={{ x: ["-120%", "0%", "0%", "120%"] }}
            transition={{ duration: DURATION_MS / 1000, times: [0, 0.22, 0.55, 1], ease: [0.3, 0, 0.15, 1] }}
          />
          <motion.div
            className="absolute -inset-[40%] origin-center bg-tava-red"
            style={{ rotate: "-22deg" }}
            initial={{ x: "-120%" }}
            animate={{ x: ["-120%", "0%", "0%", "120%"] }}
            transition={{
              duration: DURATION_MS / 1000,
              times: [0, 0.28, 0.58, 1],
              ease: [0.3, 0, 0.15, 1],
              delay: 0.05,
            }}
          />
          <motion.div
            className="absolute -inset-[40%] origin-center bg-tava-blue"
            style={{ rotate: "-22deg" }}
            initial={{ x: "-120%" }}
            animate={{ x: ["-120%", "0%", "0%", "120%"] }}
            transition={{
              duration: DURATION_MS / 1000,
              times: [0, 0.34, 0.62, 1],
              ease: [0.3, 0, 0.15, 1],
              delay: 0.1,
            }}
          />

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.9, 0.9, 1, 1.04, 1.04] }}
            transition={{ duration: DURATION_MS / 1000, times: [0, 0.28, 0.4, 0.62, 0.78] }}
          >
            <p
              className="font-display text-6xl tracking-[0.12em] text-[#FFF3D1] sm:text-7xl"
              style={{ textShadow: "6px 6px 0 #D61A21, -2px -2px 0 #FFC600" }}
            >
              TELÓN
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
