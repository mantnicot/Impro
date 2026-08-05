"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { useEffect, useState } from "react";
import { getOrFetchImage } from "@/lib/image-search";
import type { SwipeDirection } from "@/types";

const THRESHOLD = 55;

interface WordCardProps {
  word: string;
  imageUrl: string | null;
  listName: string;
  onSwipe: (direction: SwipeDirection) => void;
}

export function WordCard({ word, imageUrl, listName, onSwipe }: WordCardProps) {
  const [src, setSrc] = useState<string | null>(imageUrl);
  const [loading, setLoading] = useState(!imageUrl);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-180, 0, 180], [-12, 0, 12]);
  const cardOpacity = useTransform(x, [-160, 0, 160], [0.82, 1, 0.82]);

  useEffect(() => {
    setSrc(imageUrl);
    setLoading(!imageUrl);
    if (imageUrl) return;

    let cancelled = false;
    void getOrFetchImage(word).then((url) => {
      if (!cancelled) {
        setSrc(url);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [word, imageUrl]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const dx = info.offset.x + info.velocity.x * 0.12;
    const dy = info.offset.y + info.velocity.y * 0.12;

    if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      onSwipe(dx > 0 ? "right" : "left");
      return;
    }

    onSwipe(dy > 0 ? "down" : "up");
  };

  return (
    <motion.div
      key={word}
      className="flex h-full w-full max-w-5xl touch-none select-none flex-col items-center justify-center px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-1"
    >
      <motion.div
        drag
        dragElastic={0.78}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x, y, rotate, opacity: cardOpacity }}
        whileDrag={{ scale: 1.02, cursor: "grabbing" }}
        className="flex w-full max-w-lg cursor-grab flex-col items-center active:cursor-grabbing"
      >
        <div className="mb-2 w-full shrink-0 text-center">
          <span className="inline-block rounded-full border border-tava-purple/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-tava-purple shadow-sm sm:px-4 sm:text-sm">
            {listName}
          </span>
        </div>

        <div className="relative mb-3 w-full overflow-hidden rounded-3xl border-3 border-tava-purple/25 bg-white shadow-xl shadow-tava-purple/10 sm:mb-4">
          <div className="aspect-[4/3] max-h-[38vh] min-h-[30vh] w-full sm:max-h-[44vh] sm:min-h-[36vh]">
            {loading ? (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-50 to-amber-50">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="h-12 w-12 rounded-full border-4 border-tava-purple/20 border-t-tava-purple"
                />
              </div>
            ) : src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={word} draggable={false} className="h-full w-full object-contain bg-white p-2" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-amber-50">
                <span className="text-6xl sm:text-7xl">🎭</span>
              </div>
            )}
          </div>
        </div>

        <motion.h2
          initial={{ y: 16, opacity: 0, scale: 0.94 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full px-2 text-center font-display text-3xl font-black uppercase leading-tight text-gray-800 sm:text-5xl"
        >
          {word}
        </motion.h2>

        <p className="mt-3 px-2 text-center text-[11px] font-medium text-gray-400 sm:text-xs">
          Desliza ← → para cambiar · ↑ favorito · ↓ menú
        </p>
      </motion.div>
    </motion.div>
  );
}
