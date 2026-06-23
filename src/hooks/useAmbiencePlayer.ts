"use client";

import { useCallback, useEffect, useState } from "react";
import { parseYoutubeVideoId, type AmbienceGenre } from "@/lib/ambience-genres";
import {
  playYoutubeAmbience,
  pauseYoutubeAmbience,
  stopYoutubeAmbience,
  setYoutubeVolume,
  warmupYoutubePlayer,
  isYoutubePlayerWarm,
} from "@/lib/youtube-ambience-player";
import { unlockAudio } from "@/lib/sounds";
import { isTouchDevice } from "@/lib/device";

export function useAmbiencePlayer() {
  const [volume, setVolumeState] = useState(0.7);
  const [playing, setPlaying] = useState(false);
  const [activeGenre, setActiveGenre] = useState<AmbienceGenre | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);

  useEffect(() => {
    setNeedsUnlock(isTouchDevice() && !isYoutubePlayerWarm());
  }, []);

  useEffect(() => {
    setYoutubeVolume(volume);
  }, [volume]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    setYoutubeVolume(v);
  }, []);

  const stop = useCallback(() => {
    stopYoutubeAmbience();
    setPlaying(false);
    setLoading(false);
  }, []);

  const unlockPlayer = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await unlockAudio();
      await warmupYoutubePlayer();
      setNeedsUnlock(false);
    } catch {
      setError("No se pudo activar el reproductor. Comprueba tu conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  const playGenre = useCallback(
    async (genre: AmbienceGenre) => {
      if (isTouchDevice() && !isYoutubePlayerWarm()) {
        setError("Primero pulsa «Activar audio».");
        return;
      }

      await unlockAudio();
      const videoId = parseYoutubeVideoId(genre.youtubeUrl);
      if (!videoId) {
        setError("Enlace de YouTube no válido");
        setPlaying(false);
        return;
      }
      setError(null);
      setActiveGenre(genre);
      setLoading(true);
      try {
        await playYoutubeAmbience({ videoId }, volume);
        setPlaying(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "No se pudo reproducir.";
        setError(msg);
        setPlaying(false);
      } finally {
        setLoading(false);
      }
    },
    [volume]
  );

  const pause = useCallback(() => {
    pauseYoutubeAmbience();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) pause();
    else if (activeGenre) void playGenre(activeGenre);
  }, [playing, pause, playGenre, activeGenre]);

  return {
    volume,
    setVolume,
    playing,
    activeGenre,
    error,
    loading,
    needsUnlock,
    unlockPlayer,
    playGenre,
    pause,
    stop,
    toggle,
  };
};
