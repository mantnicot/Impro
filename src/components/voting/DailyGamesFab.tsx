"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DailyGame } from "@/lib/voting/types";

interface DailyGamesFabProps {
  games: DailyGame[];
}

const POS_KEY = "tava-games-fab-pos-v2";
const FAB_SIZE = 56;

type Pos = { left: number; top: number };

function clampPos(left: number, top: number): Pos {
  if (typeof window === "undefined") return { left, top };
  const maxLeft = Math.max(8, window.innerWidth - FAB_SIZE - 8);
  const maxTop = Math.max(8, window.innerHeight - FAB_SIZE - 8);
  return {
    left: Math.min(Math.max(8, left), maxLeft),
    top: Math.min(Math.max(8, top), maxTop),
  };
}

function defaultPos(): Pos {
  if (typeof window === "undefined") return { left: 280, top: 72 };
  return clampPos(window.innerWidth - FAB_SIZE - 12, 72);
}

export function DailyGamesFab({ games }: DailyGamesFabProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const drag = useRef({
    active: false,
    moved: false,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(POS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Pos;
        setPos(clampPos(parsed.left, parsed.top));
        return;
      }
    } catch {
      /* ignore */
    }
    setPos(defaultPos());
  }, []);

  useEffect(() => {
    const onResize = () => {
      setPos((current) => (current ? clampPos(current.left, current.top) : defaultPos()));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!pos) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      offsetX: event.clientX - pos.left,
      offsetY: event.clientY - pos.top,
    };
  }, [pos]);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active || event.pointerId !== drag.current.pointerId) return;
    const next = clampPos(
      event.clientX - drag.current.offsetX,
      event.clientY - drag.current.offsetY
    );
    if (Math.abs(next.left - (pos?.left ?? 0)) > 4 || Math.abs(next.top - (pos?.top ?? 0)) > 4) {
      drag.current.moved = true;
    }
    setPos(next);
  }, [pos]);

  const endDrag = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active || event.pointerId !== drag.current.pointerId) return;
    drag.current.active = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* noop */
    }
    setPos((current) => {
      if (!current) return current;
      const clamped = clampPos(current.left, current.top);
      localStorage.setItem(POS_KEY, JSON.stringify(clamped));
      return clamped;
    });
  }, []);

  const onClick = useCallback(() => {
    if (drag.current.moved) {
      drag.current.moved = false;
      return;
    }
    setOpen(true);
  }, []);

  if (games.length === 0 || !pos) return null;

  return (
    <>
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={onClick}
        style={{ left: pos.left, top: pos.top }}
        className="fixed z-40 flex h-14 w-14 touch-none cursor-grab items-center justify-center rounded-full border-4 border-tava-yellow bg-tava-red text-2xl text-white shadow-[4px_4px_0_rgba(11,18,32,0.45)] active:cursor-grabbing active:scale-95"
        aria-label="Ver juegos del dia. Arrastra para mover."
      >
        🎮
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-tava-blue/70 p-3 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[85dvh] w-full max-w-lg overflow-hidden rounded-3xl border-4 border-tava-yellow bg-white shadow-[8px_8px_0_rgba(11,18,32,0.35)]"
            >
              <div className="border-b-4 border-tava-yellow bg-tava-blue px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-hand text-lg text-tava-yellow">Juegos del dia</p>
                    <h3 className="font-display text-2xl tracking-wide text-white sm:text-3xl">
                      {games.length} ACTIVIDAD{games.length !== 1 ? "ES" : ""}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-tava-yellow px-3 py-1 text-sm font-black text-tava-blue shadow"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="max-h-[65dvh] space-y-3 overflow-y-auto bg-[radial-gradient(circle,rgba(26,58,130,0.06)_1px,transparent_1.2px)] bg-[length:8px_8px] p-3 sm:p-4">
                {games.map((game, index) => (
                  <motion.article
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-2xl border-2 border-tava-blue/20 bg-white p-3 shadow-sm sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tava-red font-display text-lg text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-display text-xl tracking-wide text-tava-blue sm:text-2xl">
                          {game.name}
                        </h4>
                        <p className="mt-1 font-hand text-lg leading-snug text-gray-700">{game.description}</p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
