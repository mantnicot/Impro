"use client";

import { useEffect, useRef } from "react";
import { Lottie } from "lottie-react";

/** Animación original ~0.5s; speed 0.25 → ~2s. Midpoint ~0.88s. */
const PLAYBACK_SPEED = 0.25;
const MIDPOINT_MS = 880;

interface TelonTransitionProps {
  playKey: number;
  onMidpoint: () => void;
  onComplete: () => void;
}

export function TelonTransition({ playKey, onMidpoint, onComplete }: TelonTransitionProps) {
  const midFired = useRef(false);
  const completeFired = useRef(false);

  useEffect(() => {
    if (playKey <= 0) return;
    midFired.current = false;
    completeFired.current = false;
    const mid = window.setTimeout(() => {
      if (midFired.current) return;
      midFired.current = true;
      onMidpoint();
    }, MIDPOINT_MS);
    return () => window.clearTimeout(mid);
  }, [playKey, onMidpoint]);

  if (playKey <= 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      <Lottie
        key={playKey}
        src="/lottie/transicion_telon.json"
        autoplay
        loop={false}
        speed={PLAYBACK_SPEED}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
        rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        subscriptions={{
          complete: () => {
            if (completeFired.current) return;
            completeFired.current = true;
            if (!midFired.current) {
              midFired.current = true;
              onMidpoint();
            }
            onComplete();
          },
        }}
      />
    </div>
  );
}
