"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useAmbiencePlayer } from "@/hooks/useAmbiencePlayer";
import { YoutubeAmbienceHost } from "@/components/YoutubeAmbienceHost";

type AmbiencePlayer = ReturnType<typeof useAmbiencePlayer>;

interface AmbienceContextValue extends AmbiencePlayer {
  showVideo: boolean;
  setShowVideo: (v: boolean) => void;
}

const AmbienceContext = createContext<AmbienceContextValue | null>(null);

export function AmbienceProvider({ children }: { children: ReactNode }) {
  const player = useAmbiencePlayer();
  const [showVideo, setShowVideo] = useState(false);

  const value = useMemo(
    () => ({
      ...player,
      showVideo,
      setShowVideo,
    }),
    [player, showVideo]
  );

  return (
    <AmbienceContext.Provider value={value}>
      <YoutubeAmbienceHost showVideo={showVideo && player.playing} />
      {children}
    </AmbienceContext.Provider>
  );
}

export function useAmbienceContext(): AmbienceContextValue {
  const ctx = useContext(AmbienceContext);
  if (!ctx) throw new Error("useAmbienceContext debe usarse dentro de AmbienceProvider");
  return ctx;
}
