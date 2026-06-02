"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getOrFetchImage } from "@/lib/image-search";

interface WordCardProps {
  word: string;
  imageUrl: string | null;
  listName: string;
  dragX?: number;
  dragY?: number;
}

export function WordCard({ word, imageUrl, listName, dragX = 0, dragY = 0 }: WordCardProps) {
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

  const rotate = dragX * 0.05;
  const opacity = 1 - Math.min(Math.abs(dragX) + Math.abs(dragY), 200) / 400;

  return (
    <motion.div
      className="flex h-full w-full max-w-5xl flex-col items-center px-3 py-2"
      style={{ rotate, opacity }}
      layout
    >
      <div className="mb-2 w-full shrink-0 text-center">
        <span className="inline-block rounded-full border border-tava-purple/20 bg-white px-4 py-1 text-sm font-semibold uppercase tracking-widest text-tava-purple shadow-sm">
          {listName}
        </span>
      </div>

      <div className="relative mb-3 w-full flex-1 min-h-[55vh] max-h-[65vh] overflow-hidden rounded-3xl border-3 border-tava-purple/25 bg-white shadow-xl shadow-tava-purple/10">
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
          <img src={src} alt={word} className="h-full w-full object-contain bg-white p-1" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-amber-50">
            <span className="text-7xl">🎭</span>
          </div>
        )}
      </div>

      <motion.h2
        key={word}
        initial={{ y: 20, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="shrink-0 font-display text-center text-4xl font-black uppercase leading-tight text-gray-800 sm:text-6xl md:text-7xl"
      >
        {word}
      </motion.h2>
    </motion.div>
  );
}
