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
    <motion.button
      type="button"
      aria-label="Buzzer — respuesta incorrecta"
      whileTap={{ scale: 0.92, y: 3 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-3 z-[60] h-16 w-16 select-none rounded-full border-4 border-red-900 bg-gradient-to-b from-red-400 via-red-600 to-red-800 shadow-[0_6px_0_#7f1d1d,0_10px_24px_rgba(220,38,38,0.5),inset_0_4px_14px_rgba(255,255,255,0.25)] transition-shadow active:shadow-[0_2px_0_#7f1d1d,0_4px_12px_rgba(220,38,38,0.4),inset_0_2px_8px_rgba(0,0,0,0.25)] sm:h-[4.5rem] sm:w-[4.5rem]"
    >
      <span className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/25" />
      <span className="absolute left-1/2 top-[16%] h-[30%] w-[48%] -translate-x-1/2 rounded-full bg-white/40 blur-[1px]" />
    </motion.button>
  );
}
