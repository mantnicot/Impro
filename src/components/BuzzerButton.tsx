"use client";

import { motion } from "framer-motion";
import { useCallback, useRef } from "react";
import { startBuzzer, stopBuzzer } from "@/lib/buzzer";

export function BuzzerButton() {
  const pressedRef = useRef(new Set<number>());

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pressedRef.current.has(e.pointerId)) return;
    pressedRef.current.add(e.pointerId);
    void startBuzzer(e.pointerId);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pressedRef.current.has(e.pointerId)) return;
    pressedRef.current.delete(e.pointerId);
    stopBuzzer(e.pointerId);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-3 z-[60] sm:right-5"
      aria-hidden={false}
    >
      <p className="pointer-events-none mb-1 text-center text-[10px] font-bold uppercase tracking-wide text-curtain-dark/80">
        Buzzer
      </p>
      <motion.button
        type="button"
        aria-label="Buzzer — respuesta incorrecta"
        whileTap={{ scale: 0.92, y: 3 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        className="pointer-events-auto relative h-16 w-16 select-none rounded-full border-4 border-curtain-dark bg-gradient-to-b from-curtain-light via-curtain to-curtain-dark shadow-[0_6px_0_#4a0000,0_10px_24px_rgba(139,0,0,0.45),inset_0_4px_12px_rgba(255,255,255,0.35)] transition-shadow active:shadow-[0_2px_0_#4a0000,0_4px_12px_rgba(139,0,0,0.35),inset_0_2px_8px_rgba(0,0,0,0.2)] sm:h-[4.5rem] sm:w-[4.5rem]"
      >
        <span className="absolute inset-2 rounded-full bg-gradient-to-br from-white/40 via-transparent to-black/20" />
        <span className="absolute left-1/2 top-[18%] h-[28%] w-[45%] -translate-x-1/2 rounded-full bg-white/50 blur-[1px]" />
      </motion.button>
    </div>
  );
}
