"use client";

import { motion } from "framer-motion";
import { useCallback, useRef } from "react";
import { startBuzzer, stopBuzzer } from "@/lib/buzzer";
import { startSuccessSound, stopSuccessSound } from "@/lib/success-sound";

interface SoundButtonProps {
  color: "red" | "green";
  label: string;
  compact?: boolean;
  onPointerDown: (id: number) => void;
  onPointerUp: (id: number) => void;
}

function SoundButton({ color, label, compact, onPointerDown, onPointerUp }: SoundButtonProps) {
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
    "border-red-900 bg-gradient-to-b from-red-400 via-red-600 to-red-800 shadow-[0_4px_0_#7f1d1d,0_8px_20px_rgba(220,38,38,0.45)] active:shadow-[0_2px_0_#7f1d1d]";
  const green =
    "border-green-900 bg-gradient-to-b from-green-400 via-green-600 to-green-800 shadow-[0_4px_0_#14532d,0_8px_20px_rgba(34,197,94,0.45)] active:shadow-[0_2px_0_#14532d]";

  const size = compact ? "h-14 w-14 sm:h-16 sm:w-16" : "h-16 w-16 sm:h-20 sm:w-20";

  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.92, y: 2 }}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onLostPointerCapture={handleUp}
      className={`relative select-none rounded-full border-4 ${size} ${color === "red" ? red : green}`}
    >
      <span className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/25" />
      <span className="sr-only">{label}</span>
    </motion.button>
  );
}

interface ControlDockProps {
  showGameNav?: boolean;
  aboveNav?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onFavorite?: () => void;
}

export function ControlDock({ showGameNav, aboveNav, onPrev, onNext, onFavorite }: ControlDockProps) {
  const bottom = aboveNav
    ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]"
    : "bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))]";

  if (showGameNav) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60]" aria-label="Controles de juego">
        {/* Botones de sonido en las esquinas — no tapan el nombre del objeto */}
        <div className={`pointer-events-auto fixed left-2 ${bottom} z-[61]`}>
          <SoundButton
            color="red"
            label="Incorrecto"
            compact
            onPointerDown={(id) => void startBuzzer(id)}
            onPointerUp={stopBuzzer}
          />
        </div>
        <div className={`pointer-events-auto fixed right-2 ${bottom} z-[61]`}>
          <SoundButton
            color="green"
            label="Éxito"
            compact
            onPointerDown={(id) => void startSuccessSound(id)}
            onPointerUp={stopSuccessSound}
          />
        </div>

        {/* Navegación compacta centrada, por encima de los botones de sonido */}
        <div
          className={`pointer-events-auto fixed left-1/2 ${bottom} z-[61] flex -translate-x-1/2 gap-1.5 rounded-2xl border border-white/70 bg-white/90 px-2 py-1.5 shadow-lg backdrop-blur-md`}
        >
          <button
            type="button"
            onClick={onPrev}
            className="rounded-xl border border-tava-purple/25 bg-white px-3 py-2 text-base font-bold text-tava-purple active:scale-95"
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onFavorite}
            className="rounded-xl border border-tava-neon-pink/40 bg-pink-50 px-3 py-2 text-sm font-bold text-tava-neon-pink active:scale-95"
            aria-label="Favorito"
          >
            ★
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl border border-tava-purple/25 bg-white px-3 py-2 text-base font-bold text-tava-purple active:scale-95"
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-x-0 ${bottom} z-[60] flex items-center justify-center gap-6 px-4`}
      aria-label="Controles de presentador"
    >
      <SoundButton
        color="red"
        label="Incorrecto"
        onPointerDown={(id) => void startBuzzer(id)}
        onPointerUp={stopBuzzer}
      />
      <SoundButton
        color="green"
        label="Éxito"
        onPointerDown={(id) => void startSuccessSound(id)}
        onPointerUp={stopSuccessSound}
      />
    </div>
  );
}
