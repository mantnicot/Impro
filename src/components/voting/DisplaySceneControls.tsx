"use client";

import { useMemo, useState } from "react";
import {
  DISPLAY_SCENE_LABELS,
  DISPLAY_SCENES,
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

const MANUAL_SCENES = DISPLAY_SCENES.filter((scene) => scene !== "auto" && scene !== "lobby");

export function DisplaySceneControls({ session, busy, onSetScene }: DisplaySceneControlsProps) {
  const [copied, setCopied] = useState(false);
  const configured = resolveDisplayScene(session.display_scene);
  const effective = resolveEffectiveDisplayScene(session);
  const waitingToStart = configured === "lobby";

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
        Empieza en Lobby + QR. Al comenzar, la TV sigue sola (juegos, recepcion, votos, podio) sin
        cambiar los celulares.
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
        onClick={() => onSetScene(waitingToStart ? "auto" : "lobby")}
        className={`mt-3 min-h-12 w-full rounded-xl text-sm font-black disabled:opacity-50 ${
          waitingToStart
            ? "bg-tava-yellow text-tava-blue"
            : "border-2 border-tava-yellow bg-yellow-50 text-tava-blue"
        }`}
      >
        {waitingToStart ? "Comenzar juegos (modo auto)" : "Volver a Lobby + QR"}
      </button>

      <div className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-xs text-tava-blue">
        Modo: <span className="font-black">{DISPLAY_SCENE_LABELS[configured]}</span>
        {" · "}
        En TV: <span className="font-black">{DISPLAY_SCENE_LABELS[effective]}</span>
      </div>

      <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
        Forzar escena (opcional)
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => onSetScene("auto")}
          className={`min-h-11 rounded-xl text-xs font-black disabled:opacity-50 ${
            configured === "auto"
              ? "bg-tava-yellow text-tava-blue"
              : "border border-gray-200 bg-gray-50 text-gray-600"
          }`}
        >
          Auto
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onSetScene("lobby")}
          className={`min-h-11 rounded-xl text-xs font-black disabled:opacity-50 ${
            configured === "lobby"
              ? "bg-tava-red text-white"
              : "border border-gray-200 bg-gray-50 text-gray-600"
          }`}
        >
          Lobby
        </button>
        {MANUAL_SCENES.map((scene) => (
          <button
            key={scene}
            type="button"
            disabled={busy}
            onClick={() => onSetScene(scene)}
            className={`min-h-11 rounded-xl text-xs font-black disabled:opacity-50 ${
              configured === scene
                ? "bg-tava-red text-white"
                : "border border-gray-200 bg-gray-50 text-gray-600"
            }`}
          >
            {DISPLAY_SCENE_LABELS[scene]}
          </button>
        ))}
      </div>
    </section>
  );
}
