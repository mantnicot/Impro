"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Countdown } from "./Countdown";
import { WordCard } from "./WordCard";
import { TavaLogo } from "./TavaLogo";
import { ControlDock } from "./ControlDock";
import { useGameImages } from "@/hooks/useGameImages";
import { addToFavorites, recordWordUsage } from "@/lib/storage";
import { playReveal, playSwipe, playFavorite, unlockAudio } from "@/lib/sounds";
import type { SwipeDirection } from "@/types";

type GamePhase = "intro" | "countdown" | "playing";

interface GameScreenProps {
  listName: string;
  words: string[];
  useAllWords?: boolean;
  logoUrl?: string | null;
  soundEnabled?: boolean;
  showControls?: boolean;
  onMenu: () => void;
  onExit: () => void;
  onFavoritesChanged?: () => void;
}

export function GameScreen({
  listName,
  words,
  useAllWords = false,
  logoUrl,
  soundEnabled = true,
  showControls = true,
  onMenu,
  onExit,
  onFavoritesChanged,
}: GameScreenProps) {
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [favoriteFlash, setFavoriteFlash] = useState(false);
  const countdownDone = useRef(false);

  const { current, preparing, advance, warmUp } = useGameImages(words, true, useAllWords);

  useEffect(() => {
    void unlockAudio();
    warmUp();
  }, [warmUp]);

  useEffect(() => {
    if (current?.word) {
      if (countdownDone.current && phase === "countdown") {
        if (soundEnabled) playReveal();
        recordWordUsage(current.word);
        setPhase("playing");
      }
    }
  }, [current, phase, soundEnabled]);

  useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => setPhase("countdown"), 800);
    return () => clearTimeout(t);
  }, [phase]);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      if (phase !== "playing" || !current) return;

      if (direction === "down") {
        onMenu();
        return;
      }

      if (direction === "up") {
        if (soundEnabled) playFavorite();
        await addToFavorites(current.word);
        onFavoritesChanged?.();
        setFavoriteFlash(true);
        setTimeout(() => setFavoriteFlash(false), 600);
        return;
      }

      if (soundEnabled) playSwipe();
      const next = await advance(direction === "right" ? "next" : "prev");
      if (next) recordWordUsage(next.word);
    },
    [phase, current, soundEnabled, onMenu, advance, onFavoritesChanged]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          void handleSwipe("right");
          break;
        case "ArrowLeft":
          void handleSwipe("left");
          break;
        case "ArrowUp":
          void handleSwipe("up");
          break;
        case "ArrowDown":
          void handleSwipe("down");
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSwipe]);

  const handleCountdownComplete = () => {
    countdownDone.current = true;
    if (current?.word) {
      if (soundEnabled) playReveal();
      recordWordUsage(current.word);
      setPhase("playing");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const showPlaying = phase === "playing" && current?.word;
  const waitingForImage = phase === "countdown" && countdownDone.current && !current?.word;

  return (
    <div className="relative flex h-full min-h-screen flex-col bg-theater-gradient pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
      <AnimatePresence>
        {favoriteFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
          >
            <div className="rounded-2xl border-2 border-tava-neon-pink bg-white px-8 py-4 text-2xl font-bold text-tava-neon-pink shadow-lg">
              ★ ¡Agregado a Favoritos!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative z-10 flex items-center justify-between px-4 py-2">
        <button
          onClick={onExit}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm transition hover:border-tava-purple hover:text-tava-purple"
        >
          ← Salir
        </button>
        <TavaLogo size="sm" logoUrl={logoUrl} />
        <button
          onClick={toggleFullscreen}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm transition hover:border-tava-purple hover:text-tava-purple"
          title="Pantalla completa"
        >
          ⛶
        </button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-hidden">
        {phase === "intro" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
            <TavaLogo size="xl" logoUrl={logoUrl} animated />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-medium text-tava-purple"
            >
              {listName}
            </motion.p>
          </motion.div>
        )}

        {phase === "countdown" && !waitingForImage && <Countdown onComplete={handleCountdownComplete} />}

        {(waitingForImage || (phase === "playing" && preparing && !current)) && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="h-14 w-14 rounded-full border-4 border-tava-purple/20 border-t-tava-purple"
          />
        )}

        {showPlaying && current && (
          <WordCard
            word={current.word}
            imageUrl={current.imageUrl}
            listName={listName}
            onSwipe={(d) => void handleSwipe(d)}
          />
        )}
      </main>

      {showControls && showPlaying && (
        <ControlDock
          showGameNav
          onPrev={() => void handleSwipe("left")}
          onNext={() => void handleSwipe("right")}
          onFavorite={() => void handleSwipe("up")}
        />
      )}
    </div>
  );
}
