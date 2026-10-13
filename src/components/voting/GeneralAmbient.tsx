"use client";

/**
 * Wrappers mínimos para la escena `general` del proyector.
 *
 *   <GameSwap gameKey={active_game_index}>…</GameSwap>   entrada clara al cambiar de juego
 *   <LiveGameCard>…card amarilla "En curso"…</LiveGameCard>   sombra comic + float + borde que pulsa
 *   <RankingList version={…}><RankingItem index={i}>…</RankingItem></RankingList>   stagger suave
 *
 * Nada toca lógica de escenas ni datos: solo envuelven lo que ya renderizas.
 * prefers-reduced-motion: todo queda quieto.
 */

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";

const mirror = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: "easeInOut" as const,
});

/* ───────────── GameSwap: highlight al cambiar active_game_index ───────────── */

export function GameSwap({
  gameKey,
  children,
  className = "",
}: {
  gameKey: string | number;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const firstRender = useRef(true);
  useEffect(() => {
    firstRender.current = false;
  }, []);

  if (reduce) return <div className={className}>{children}</div>;

  // Se lee en render: en el primer montaje no hay barrido, solo en cambios posteriores
  const sweep = !firstRender.current;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={gameKey}
        className={`relative ${className}`}
        initial={{ opacity: 0, x: 70, rotate: -2, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, x: -50, transition: { duration: 0.18, ease: "easeIn" } }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        {children}
        {sweep && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 origin-left bg-[#FFC600]"
            initial={{ scaleX: 0, opacity: 0.85 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ───────────── LiveGameCard: card "En curso" con vida ───────────── */

export function LiveGameCard({
  children,
  className = "",
  radiusClass = "rounded-2xl",
}: {
  children: ReactNode;
  className?: string;
  /** Radio de tu card amarilla, para que sombra y borde coincidan. */
  radiusClass?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={`relative ${className}`}
      animate={reduce ? undefined : { y: [0, -4] }}
      transition={mirror(12)}
    >
      {/* sombra offset estilo comic */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 translate-x-2.5 translate-y-2.5 bg-[#0B1220] ${radiusClass}`}
      />
      <div className="relative z-10">{children}</div>
      {/* borde que pulsa (solo opacidad + escala) */}
      <motion.span
        aria-hidden
        className={`pointer-events-none absolute -inset-1 z-20 border-4 border-[#FFC600] ${radiusClass}`}
        style={{ opacity: reduce ? 0.8 : undefined }}
        animate={reduce ? undefined : { opacity: [1, 0.35], scale: [1, 1.01] }}
        transition={mirror(6)}
      />
    </motion.div>
  );
}

/* ───────────── Ranking lateral con stagger suave ───────────── */

const listVariants: Variants = { idle: {}, a: {}, b: {} };

const itemVariants: Variants = {
  idle: { opacity: 1, y: 0 },
  // dos nombres idénticos: alternarlos re-dispara la animación en cada actualización
  a: (i: number) => ({
    opacity: [0.55, 1],
    y: [10, 0],
    transition: { delay: i * 0.06, duration: 0.38, ease: "easeOut" },
  }),
  b: (i: number) => ({
    opacity: [0.55, 1],
    y: [10, 0],
    transition: { delay: i * 0.06, duration: 0.38, ease: "easeOut" },
  }),
};

export function RankingList({
  version,
  children,
  className = "",
}: {
  /** Cambia cuando cambia el ranking (p. ej. results.map(r => `${r.artist.id}:${r.totalPoints}`).join("|")). */
  version: string | number;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setTick((t) => t + 1);
  }, [version]);

  const state = reduce || tick === 0 ? "idle" : tick % 2 ? "a" : "b";

  return (
    <motion.ul className={className} variants={listVariants} initial="idle" animate={state}>
      {Children.toArray(children)}
    </motion.ul>
  );
}

export function RankingItem({
  index,
  children,
  className = "",
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.li
      className={className}
      variants={itemVariants}
      custom={index}
      layout="position"
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      {children}
    </motion.li>
  );
}
