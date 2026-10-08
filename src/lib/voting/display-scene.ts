export const DISPLAY_SCENES = [
  "auto",
  "lobby",
  "collecting",
  "roulette",
  "winner",
  "voting",
  "results",
  "games",
  "black",
] as const;

export type DisplayScene = (typeof DISPLAY_SCENES)[number];

export const DISPLAY_SCENE_LABELS: Record<DisplayScene, string> = {
  auto: "Auto",
  lobby: "Lobby + QR",
  collecting: "Recibiendo",
  roulette: "Ruleta",
  winner: "Ganador",
  voting: "Voten",
  results: "Ranking",
  games: "Juegos",
  black: "Negro",
};

export function isDisplayScene(value: unknown): value is DisplayScene {
  return typeof value === "string" && (DISPLAY_SCENES as readonly string[]).includes(value);
}

export function resolveDisplayScene(value: unknown): DisplayScene {
  return isDisplayScene(value) ? value : "auto";
}

/** Escena efectiva en el proyector (auto sigue el estado del juego sin tocar celulares). */
export function resolveEffectiveDisplayScene(session: {
  display_scene?: string | null;
  is_open?: boolean;
  show_results?: boolean;
  object_collection_open?: boolean;
  selected_objects?: string[] | null;
  roulette_spun_at?: string | null;
}): DisplayScene {
  const configured = resolveDisplayScene(session.display_scene);
  if (configured !== "auto") return configured;

  if (session.show_results) return "results";
  if (session.roulette_spun_at && (session.selected_objects?.length ?? 0) > 0) return "winner";
  if (session.object_collection_open) return "collecting";
  if (session.is_open) return "voting";
  return "lobby";
}
