"use client";

import { useEffect, useRef, useState } from "react";
import { setYoutubePlayerHost } from "@/lib/youtube-ambience-player";
import { isTouchDevice } from "@/lib/device";

interface YoutubeAmbienceHostProps {
  /** Mostrar video de fondo (solo audio sigue siendo el del mismo reproductor) */
  showVideo?: boolean;
}

export function YoutubeAmbienceHost({ showVideo = false }: YoutubeAmbienceHostProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setYoutubePlayerHost(el);
    return () => setYoutubePlayerHost(null);
  }, []);

  if (showVideo) {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.22]"
      >
        <div ref={ref} className="h-full w-full min-h-[200px] min-w-[280px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
      </div>
    );
  }

  /* iOS/Safari bloquean audio si el iframe está fuera del viewport (p. ej. left: -9999). */
  if (touch) {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 right-0 z-[2] h-px w-px overflow-hidden opacity-[0.02]"
      >
        <div ref={ref} className="h-[200px] w-[280px]" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-0 right-0 z-[2] overflow-hidden opacity-[0.01]"
      style={{ width: 200, height: 200 }}
    >
      <div ref={ref} className="h-full w-full min-h-[200px] min-w-[280px]" />
    </div>
  );
}
