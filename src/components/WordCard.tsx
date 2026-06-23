"use client";

import { motion, type PanInfo } from "framer-motion";
import { useEffect, useState } from "react";
import { getOrFetchImage } from "@/lib/image-search";
import type { SwipeDirection } from "@/types";

const THRESHOLD = 70;

interface WordCardProps {
  word: string;
  imageUrl: string | null;
  listName: string;
  onSwipe: (direction: SwipeDirection) => void;
}

export function WordCard({ word, imageUrl, listName, onSwipe }: WordCardProps) {
  const [src, setSrc] = useState<string | null>(imageUrl);
  const [loading, setLoading] = useState(!imageUrl);

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
    const { offset, velocity } = info;
    const dx = offset.x + velocity.x * 0.15;
    const dy = offset.y + velocity.y * 0.15;

    if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      onSwipe(dx > 0 ? "right" : "left");
    } else {
      onSwipe(dy > 0 ? "down" : "up");
    }
  };

  return (
    <motion.div
      key={word}
      drag
      dragElastic={0.85}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
      style={{ touchAction: "none" }}
      className="flex h-full w-full max-w-5xl cursor-grab flex-col items-center px-3 py-2 active:cursor-grabbing"
    >
      <motion.div
        className="flex w-full flex-col items-center"
        style={{ rotate: 0 }}
        animate={{ x: 0, y: 0 }}
        drag={false}
      >
        <div className="mb-2 w-full shrink-0 text-center">
          <span className="inline-block rounded-full border border-tava-purple/20 bg-white px-4 py-1 text-sm font-semibold uppercase tracking-widest text-tava-purple shadow-sm">
            {listName}
          </span>
        </div>

        <div className="relative mb-3 w-full min-h-[50vh] max-h-[60vh] flex-1 overflow-hidden rounded-3xl border-3 border-tava-purple/25 bg-white shadow-xl shadow-tava-purple/10">
          {loading ? (
            <div className="flex h-full min-h-[50vh] items-center justify-center bg-gradient-to-br from-purple-50 to-amber-50">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="h-12 w-12 rounded-full border-4 border-tava-purple/20 border-t-tava-purple"
              />
            </div>
          ) : src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={word} draggable={false} className="h-full w-full object-contain bg-white p-1" />
          ) : (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-amber-50">
              <span className="text-7xl">🎭</span>
            </div>
          )}
        </div>

        <motion.h2
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 font-display text-center text-4xl font-black uppercase leading-tight text-gray-800 sm:text-6xl md:text-7xl"
        >
          {word}
        </motion.h2>
      </motion.div>
    </motion.div>
  );
}
