"use client";

import { useCallback, useRef } from "react";
import type { SwipeDirection } from "@/types";

const THRESHOLD = 60;

interface SwipeHandlers {
  onSwipe: (direction: SwipeDirection) => void;
}

export function useSwipe({ onSwipe }: SwipeHandlers) {
  const start = useRef({ x: 0, y: 0 });
  const tracking = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY };
    tracking.current = true;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!tracking.current) return;
      tracking.current = false;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;

      if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        onSwipe(dx > 0 ? "right" : "left");
      } else {
        onSwipe(dy > 0 ? "down" : "up");
      }
    },
    [onSwipe]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          onSwipe("right");
          break;
        case "ArrowLeft":
          onSwipe("left");
          break;
        case "ArrowUp":
          onSwipe("up");
          break;
        case "ArrowDown":
          onSwipe("down");
          break;
      }
    },
    [onSwipe]
  );

  return { onTouchStart, onTouchEnd, onKeyDown };
}
