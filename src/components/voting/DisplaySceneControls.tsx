"use client";

import { useMemo, useState } from "react";
import {
  CONTROL_SCENE_BUTTONS,
  DISPLAY_SCENE_LABELS,
  resolveDisplayScene,
  resolveEffectiveDisplayScene,
  type DisplayScene,
} from "@/lib/voting/display-scene";
import type { VotingSession } from "@/lib/voting/types";

interface DisplaySceneControlsProps {
  session: VotingSession;
  busy: boolean;
  onSetScene: (scene: DisplayScene) => void;
}

export function DisplaySceneControls({ session, busy, onSetScene }: DisplaySceneControlsProps) {
  const [copied, setCopied] = useState(false);
  const configured = resolveDisplayScene(session.display_scene);
  const effective = resolveEffectiveDisplayScene(session);

  const displayUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/?display=${encodeURIComponent(session.code)}`;
  }, [session.code]);

  const openDisplay = () => {
    if (!displayUrl) return;
    window.open(displayUrl, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    if (!displayUrl) return;
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rounded-2xl border-4 border-tava-blue bg-white p-4 shadow-sm">
      <p className="font-hand text-lg text-tava-red">Videobeam / TV</p>
      <h2 className="font-display text-2xl tracking-wide text-tava-blue">PANTALLA DEL SHOW</h2>
      <p className="mt-1 text-xs text-gray-500">
        Estos botones solo cambian el proyector. No cambian la pantalla de los celulares.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={openDisplay}
          className="min-h-11 rounded-xl bg-tava-blue text-sm font-black text-white"
        >
          Abrir pantalla del show
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="min-h-11 rounded-xl border-2 border-tava-blue text-sm font-black text-tava-blue"
        >
          {copied ? "Enlace copiado" : "Copiar enlace proyector"}
        </button>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => onSetScene("auto")}
        className={`mt-3 min-h-12 w-full rounded-xl text-sm font-black disabled:opacity-50 ${
          configured === "auto"
            ? "bg-tava-yellow text-tava-blue"
            : "border-2 border-tava-yellow bg-yellow-50 text-tava-blue"
        }`}
      >
        Modo Auto (lee el juego activo)
      </button>

      <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-tava-blue">
        Boton: <span className="font-black">{DISPLAY_SCENE_LABELS[configured]}</span>
        {" · "}
        En TV: <span className="font-black">{DISPLAY_SCENE_LABELS[effective]}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CONTROL_SCENE_BUTTONS.map((scene) => {
          const active = configured === scene;
          return (
            <button
              key={scene}
              type="button"
              disabled={busy}
              onClick={() => onSetScene(scene)}
              className={`min-h-12 rounded-xl text-sm font-black disabled:opacity-50 ${
                active ? "bg-tava-red text-white" : "border border-gray-200 bg-gray-50 text-gray-700"
              }`}
            >
              {DISPLAY_SCENE_LABELS[scene]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
