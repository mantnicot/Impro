"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useAmbiencePlayer } from "@/hooks/useAmbiencePlayer";
import { YoutubeAmbienceHost } from "@/components/YoutubeAmbienceHost";

type AmbiencePlayer = ReturnType<typeof useAmbiencePlayer>;

const AmbienceContext = createContext<AmbiencePlayer | null>(null);

export function AmbienceProvider({ children }: { children: ReactNode }) {
  const player = useAmbiencePlayer();

  return (
    <AmbienceContext.Provider value={player}>
      <YoutubeAmbienceHost />
      {children}
    </AmbienceContext.Provider>
  );
}

export function useAmbienceContext(): AmbiencePlayer {
  const ctx = useContext(AmbienceContext);
  if (!ctx) throw new Error("useAmbienceContext debe usarse dentro de AmbienceProvider");
  return ctx;
}
