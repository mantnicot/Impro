"use client";

import { motion } from "framer-motion";
import { useCallback, useRef } from "react";
import { startBuzzer, stopBuzzer } from "@/lib/buzzer";
import { startSuccessSound, stopSuccessSound } from "@/lib/success-sound";

interface SoundButtonProps {
  color: "red" | "green";
  label: string;
  onPointerDown: (id: number) => void;
  onPointerUp: (id: number) => void;
}

function SoundButton({ color, label, onPointerDown, onPointerUp }: SoundButtonProps) {
  const pressedRef = useRef(new Set<number>());

  const handleDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      if (pressedRef.current.has(e.pointerId)) return;
      pressedRef.current.add(e.pointerId);
      onPointerDown(e.pointerId);
    },
    [onPointerDown]
  );

  const handleUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!pressedRef.current.has(e.pointerId)) return;
      pressedRef.current.delete(e.pointerId);
      onPointerUp(e.pointerId);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    },
    [onPointerUp]
  );

  const red =
    "border-red-900 bg-gradient-to-b from-red-400 via-red-600 to-red-800 shadow-[0_6px_0_#7f1d1d,0_10px_24px_rgba(220,38,38,0.5)] active:shadow-[0_2px_0_#7f1d1d]";
  const green =
    "border-green-900 bg-gradient-to-b from-green-400 via-green-600 to-green-800 shadow-[0_6px_0_#14532d,0_10px_24px_rgba(34,197,94,0.5)] active:shadow-[0_2px_0_#14532d]";

  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.92, y: 3 }}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onLostPointerCapture={handleUp}
      className={`relative h-20 w-20 select-none rounded-full border-4 sm:h-24 sm:w-24 ${color === "red" ? red : green}`}
    >
      <span className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/25" />
      <span className="absolute left-1/2 top-[16%] h-[30%] w-[48%] -translate-x-1/2 rounded-full bg-white/40 blur-[1px]" />
      <span className="sr-only">{label}</span>
    </motion.button>
  );
}

interface ControlDockProps {
  showGameNav?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onFavorite?: () => void;
}

export function ControlDock({ showGameNav, onPrev, onNext, onFavorite }: ControlDockProps) {
  return (
    <div
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-[60] px-3"
      aria-label="Controles de presentador"
    >
      <div className="mx-auto flex max-w-lg items-end justify-center gap-3 rounded-2xl border border-white/60 bg-white/90 p-3 shadow-xl backdrop-blur-md">
        <SoundButton
          color="red"
          label="Incorrecto"
          onPointerDown={(id) => void startBuzzer(id)}
          onPointerUp={stopBuzzer}
        />

        {showGameNav && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPrev}
                className="rounded-xl border-2 border-tava-purple/30 bg-white px-4 py-3 text-lg font-bold text-tava-purple shadow-sm active:scale-95"
              >
                ←
              </button>
              <button
                type="button"
                onClick={onNext}
                className="rounded-xl border-2 border-tava-purple/30 bg-white px-4 py-3 text-lg font-bold text-tava-purple shadow-sm active:scale-95"
              >
                →
              </button>
            </div>
            <button
              type="button"
              onClick={onFavorite}
              className="rounded-xl border-2 border-tava-neon-pink/40 bg-pink-50 py-2 text-sm font-bold text-tava-neon-pink active:scale-95"
            >
              ★ Favorito
            </button>
          </div>
        )}

        <SoundButton
          color="green"
          label="Éxito"
          onPointerDown={(id) => void startSuccessSound(id)}
          onPointerUp={stopSuccessSound}
        />
      </div>
    </div>
  );
}
