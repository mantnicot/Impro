"use client";

import { useEffect, useRef } from "react";
import { setYoutubePlayerHost } from "@/lib/youtube-ambience-player";

interface YoutubeAmbienceHostProps {
  /** Mostrar video de fondo (solo audio sigue siendo el del mismo reproductor) */
  showVideo?: boolean;
}

export function YoutubeAmbienceHost({ showVideo = false }: YoutubeAmbienceHostProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setYoutubePlayerHost(el);
    return () => setYoutubePlayerHost(null);
  }, []);

  return (
    <div
      aria-hidden
      className={
        showVideo
          ? "pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.22]"
          : "pointer-events-none fixed overflow-hidden opacity-[0.01]"
      }
      style={
        showVideo
          ? undefined
          : { width: 200, height: 200, left: -9999, top: 0 }
      }
    >
      <div ref={ref} className="h-full w-full min-h-[200px] min-w-[280px]" />
      {showVideo && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
      )}
    </div>
  );
}
