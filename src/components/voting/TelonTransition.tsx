"use client";

import { useEffect, useRef } from "react";
import { Lottie } from "lottie-react";

/** Mitad del telón (frames ~9–20 @60fps): momento seguro para cambiar el slide. */
const MIDPOINT_MS = 220;

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
