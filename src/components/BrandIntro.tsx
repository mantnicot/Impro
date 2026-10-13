"use client";

/**
 * BrandIntro — intro corta (~2.3 s) de marca TAVA al abrir `/`.
 *
 * - Se salta con clic / toque / Enter / Espacio / Escape.
 * - Una vez por sesión (sessionStorage `tava-intro-seen`); si ya se vio, desaparece al montar.
 * - Se dibuja encima del home (fixed, z-[100]) y sale con fundido: el home no cambia de layout.
 * - prefers-reduced-motion: marca estática ~0.9 s y fundido, sin movimiento.
 *
 * Coreografía (ms): rayos 0 · pop logo 150 · flash amarillo 450 · "EN EL ACTO" 600 ·
 * "#TAVA" 900 · salida 2000–2300.
 */

import { useCallback, useEffect, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  /** Tu <TavaLogo /> si quieres usarlo en lugar del texto de marca. */
  logo?: ReactNode;
  storageKey?: string;
  /** Pon false para que se vea en cada carga (útil para ensayar). */
  once?: boolean;
  onDone?: () => void;
};

const TOTAL_MS = 2300;

// Puntos halftone que "revientan" desde el centro (posiciones fijas = sin hydration mismatch)
const BURST = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const radius = 26 + (i % 3) * 9; // vmin
  return {
    id: i,
    x: Math.round(Math.cos(angle) * radius * 10) / 10,
    y: Math.round(Math.sin(angle) * radius * 10) / 10,
    size: 10 + (i % 4) * 6,
    color: i % 3 === 0 ? "#D61A21" : i % 3 === 1 ? "#FFC600" : "#FFFFFF",
  };
});

type Status = "checking" | "playing" | "done";

export default function BrandIntro({
  logo,
  storageKey = "tava-intro-seen",
  once = true,
  onDone,
}: Props) {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Status>("checking");
  const [leaving, setLeaving] = useState(false);

  // ¿Ya se vio en esta sesión?
  useEffect(() => {
    let seen = false;
    try {
      seen = once && sessionStorage.getItem(storageKey) === "1";
    } catch {
      /* storage bloqueado: se muestra igual */
    }
    if (seen) {
      setStatus("done");
      onDone?.();
    } else {
      setStatus("playing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leave = useCallback(() => {
    setLeaving(true);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignorar */
    }
  }, [storageKey]);

  // Cierre automático
  useEffect(() => {
    if (status !== "playing") return;
    const t = window.setTimeout(leave, reduce ? 900 : TOTAL_MS);
    return () => window.clearTimeout(t);
  }, [status, reduce, leave]);

  // Escape también salta
  useEffect(() => {
    if (status !== "playing") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && leave();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, leave]);

  if (status === "done") return null;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      leave();
    }
  };

  const playing = status === "playing";

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label="Saltar intro de TAVA"
      onClick={leave}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-[#0B1220] outline-none"
      style={{ pointerEvents: leaving ? "none" : "auto" }}
      initial={false}
      animate={leaving ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
      transition={{ duration: reduce ? 0.2 : 0.35, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (leaving) {
          setStatus("done");
          onDone?.();
        }
      }}
    >
      {/* Fondo de afiche */}
      <div className="bg-theater-gradient absolute inset-0" aria-hidden />
      <div className="bg-halftone-dots absolute inset-0 opacity-50" aria-hidden />

      {playing && !reduce && (
        <>
          {/* Rayos de spotlight que se abren */}
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[190vmax] w-[190vmax] will-change-transform"
            style={{
              marginLeft: "-95vmax",
              marginTop: "-95vmax",
              background:
                "repeating-conic-gradient(from 0deg, rgba(255,198,0,.16) 0deg 7deg, transparent 7deg 20deg)",
              WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 55%)",
              maskImage: "radial-gradient(circle, #000 0%, transparent 55%)",
            }}
            initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 14 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
          />

          {/* Puntos halftone que revientan */}
          {BURST.map((d) => (
            <motion.span
              key={d.id}
              aria-hidden
              className="absolute left-1/2 top-1/2 rounded-full will-change-transform"
              style={{ width: d.size, height: d.size, background: d.color, marginLeft: -d.size / 2, marginTop: -d.size / 2 }}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
              animate={{ opacity: [0, 0.9, 0], x: `${d.x}vmin`, y: `${d.y}vmin`, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.5, ease: "easeOut", times: [0, 0.3, 1] }}
            />
          ))}
        </>
      )}

      {/* Marca */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.35, rotate: -9 }}
          animate={playing ? { opacity: 1, scale: 1, rotate: -3 } : undefined}
          transition={{ type: "spring", stiffness: 280, damping: 15, delay: reduce ? 0 : 0.15 }}
        >
          {logo ?? (
            <span
              className="font-display block leading-none text-white"
              style={{
                fontSize: "clamp(4rem, 17vw, 13rem)",
                textShadow: "0.06em 0.06em 0 #D61A21",
                letterSpacing: "0.02em",
              }}
            >
              TAVA
            </span>
          )}
        </motion.div>

        {/* Cinta roja "EN EL ACTO" */}
        <motion.div
          className="mt-4 -skew-x-6 border-4 border-[#FFC600] bg-[#D61A21] px-6 py-1 shadow-[8px_8px_0_#0B1220]"
          initial={reduce ? false : { opacity: 0, y: 70 }}
          animate={playing ? { opacity: 1, y: 0 } : undefined}
          transition={{ type: "spring", stiffness: 320, damping: 22, delay: reduce ? 0 : 0.6 }}
        >
          <span
            className="font-display block uppercase leading-tight text-white"
            style={{ fontSize: "clamp(1.5rem, 5vw, 3.75rem)", letterSpacing: "0.12em" }}
          >
            En el acto
          </span>
        </motion.div>

        {/* #TAVA a mano, con subrayado que se dibuja */}
        <motion.div
          className="relative mt-5"
          initial={reduce ? false : { opacity: 0, rotate: -9, y: 16 }}
          animate={playing ? { opacity: 1, rotate: -4, y: 0 } : undefined}
          transition={{ duration: 0.4, ease: "easeOut", delay: reduce ? 0 : 0.9 }}
        >
          <span className="font-hand block text-[#FFC600]" style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}>
            #TAVA
          </span>
          <svg aria-hidden viewBox="0 0 200 14" className="absolute -bottom-2 left-0 h-3 w-full" preserveAspectRatio="none">
            <motion.path
              d="M2 9 C 40 2, 80 14, 120 6 S 178 4, 198 8"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={playing ? { pathLength: 1 } : undefined}
              transition={{ duration: 0.45, ease: "easeOut", delay: reduce ? 0 : 1.1 }}
            />
          </svg>
        </motion.div>

        <span className="sr-only">Toca o presiona una tecla para saltar la intro</span>
      </div>

      {/* Flash amarillo */}
      {playing && !reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#FFC600]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.35, delay: 0.45, times: [0, 0.3, 1] }}
        />
      )}
    </motion.div>
  );
}
