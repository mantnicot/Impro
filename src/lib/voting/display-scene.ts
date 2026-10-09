import { clampGameIndex } from "@/lib/voting/parse-games-paste";
import type { DailyGame } from "@/lib/voting/types";

export const DISPLAY_SCENES = [
  "auto",
  "lobby",
  "collecting",
  "roulette",
  "winner",
  "voting",
  "general",
  "results",
  "games",
  "black",
] as const;

export type DisplayScene = (typeof DISPLAY_SCENES)[number];

/** Botones principales del control de show */
export const CONTROL_SCENE_BUTTONS: DisplayScene[] = [
  "lobby",
  "collecting",
  "roulette",
  "winner",
  "voting",
  "general",
];

export const DISPLAY_SCENE_LABELS: Record<DisplayScene, string> = {
  auto: "Auto",
  lobby: "Lobby",
  collecting: "Recibiendo",
  roulette: "Ruleta",
  winner: "Ganador",
  voting: "Votacion",
  general: "General",
  results: "Ranking",
  games: "Juegos",
  black: "Negro",
};

export type GameModeHint = "voting" | "objects" | "general";

export function isDisplayScene(value: unknown): value is DisplayScene {
  return typeof value === "string" && (DISPLAY_SCENES as readonly string[]).includes(value);
}

export function resolveDisplayScene(value: unknown): DisplayScene {
  return isDisplayScene(value) ? value : "lobby";
}

/** Detecta el tipo de bloque segun el nombre del juego activo. */
export function detectGameModeHint(game?: Pick<DailyGame, "name" | "description"> | null): GameModeHint {
  const text = `${game?.name ?? ""} ${game?.description ?? ""}`.toLocaleLowerCase("es");
  if (/votaci[oó]n|voten|\bvoto\b/.test(text)) return "voting";
  if (/objeto|premis|piropo|ruleta|palabra/.test(text)) return "objects";
  return "general";
}

export function getActiveDailyGame(session: {
  daily_games?: DailyGame[] | null;
  active_game_index?: number | null;
}): DailyGame | null {
  const games = session.daily_games ?? [];
  if (games.length === 0) return null;
  const index = clampGameIndex(session.active_game_index ?? 0, games.length);
  return games[index] ?? null;
}

/**
 * Escena efectiva en el proyector.
 * - lobby: QR hasta arrancar
 * - auto: lee el juego activo (votacion / objetos-premisas-piropos / general)
 * - manual: respeta el boton del admin
 */
export function resolveEffectiveDisplayScene(session: {
  display_scene?: string | null;
  is_open?: boolean;
  show_results?: boolean;
  object_collection_open?: boolean;
  selected_objects?: string[] | null;
  roulette_spun_at?: string | null;
  daily_games?: DailyGame[] | null;
  active_game_index?: number | null;
}): DisplayScene {
  const configured = resolveDisplayScene(session.display_scene);

  if (configured === "lobby") return "lobby";
  if (configured !== "auto") return configured;

  // Auto: el juego activo manda (no se queda pegado en un objeto viejo).
  const hint = detectGameModeHint(getActiveDailyGame(session));

  if (hint === "voting") {
    return session.show_results ? "general" : "voting";
  }

  if (hint === "objects") {
    if (session.object_collection_open) return "collecting";
    if (session.roulette_spun_at && (session.selected_objects?.length ?? 0) > 0) return "winner";
    return "collecting";
  }

  if (session.is_open) return "voting";
  if (session.show_results) return "general";
  return "general";
}

/** Solo permite overlay de ruleta en modo objetos/ruleta; Ganador/Lobby/etc. la cierran. */
export function shouldShowStageRoulette(session: {
  display_scene?: string | null;
  daily_games?: DailyGame[] | null;
  active_game_index?: number | null;
  roulette_spun_at?: string | null;
  selected_objects?: string[] | null;
}): boolean {
  const configured = resolveDisplayScene(session.display_scene);
  if (
    configured === "winner" ||
    configured === "lobby" ||
    configured === "voting" ||
    configured === "general" ||
    configured === "results" ||
    configured === "games" ||
    configured === "black"
  ) {
    return false;
  }

  if (configured === "roulette") return true;

  const effective = resolveEffectiveDisplayScene(session);
  if (effective === "roulette") return true;

  // Auto + juego de objetos/premisas/piropos: el sorteo puede cubrir la TV
  return configured === "auto" && detectGameModeHint(getActiveDailyGame(session)) === "objects";
}
