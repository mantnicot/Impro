"use client";

import { useEffect, useRef, useState } from "react";
import { setYoutubePlayerHost } from "@/lib/youtube-ambience-player";
import { isTouchDevice } from "@/lib/device";

export function YoutubeAmbienceHost() {
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
