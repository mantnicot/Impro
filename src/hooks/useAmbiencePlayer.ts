"use client";

import { useCallback, useEffect, useState } from "react";
import { parseYoutubeVideoId, type AmbienceGenre } from "@/lib/ambience-genres";
import {
  playYoutubeAmbience,
  pauseYoutubeAmbience,
  stopYoutubeAmbience,
  setYoutubeVolume,
} from "@/lib/youtube-ambience-player";
import { unlockAudio } from "@/lib/sounds";

export function useAmbiencePlayer() {
  const [volume, setVolumeState] = useState(0.7);
  const [playing, setPlaying] = useState(false);
  const [activeGenre, setActiveGenre] = useState<AmbienceGenre | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const playGenre = useCallback(async (genre: AmbienceGenre) => {
    await unlockAudio();
    const videoId = parseYoutubeVideoId(genre.youtubeUrl);
    if (!videoId) {
      setError("Enlace de YouTube no válido");
      setPlaying(false);
      return;
    }
    setError(null);
    setActiveGenre(genre);
    try {
      await playYoutubeAmbience({ videoId });
      setPlaying(true);
    } catch {
      setError("No se pudo reproducir. Revisa el enlace o tu conexión.");
      setPlaying(false);
    }
  }, []);

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
    playGenre,
    pause,
    stop,
    toggle,
  };
}
