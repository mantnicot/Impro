import type { DailyGame } from "@/lib/voting/types";
import { clampGameIndex } from "@/lib/voting/parse-games-paste";

export interface DailyGamesPayload {
  games: DailyGame[];
  activeIndex: number;
}

function parseGameItem(item: unknown): DailyGame | null {
  if (item == null || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const name = String(row.name ?? "").trim();
  if (!name) return null;
  return {
    id: String(row.id ?? crypto.randomUUID()),
    name,
    description: String(row.description ?? "").trim(),
  };
}

/** Acepta array legacy o { activeIndex, items/games }. Sin columna nueva. */
export function parseDailyGamesPayload(value: unknown): DailyGamesPayload {
  if (Array.isArray(value)) {
    const games = value.map(parseGameItem).filter((game): game is DailyGame => game != null);
    return { games, activeIndex: 0 };
  }

  if (value != null && typeof value === "object") {
    const row = value as Record<string, unknown>;
    const list = Array.isArray(row.items)
      ? row.items
      : Array.isArray(row.games)
        ? row.games
        : [];
    const games = list.map(parseGameItem).filter((game): game is DailyGame => game != null);
    return {
      games,
      activeIndex: clampGameIndex(Number(row.activeIndex ?? row.active_game_index ?? 0), games.length),
    };
  }

  return { games: [], activeIndex: 0 };
}

export function serializeDailyGamesPayload(
  games: DailyGame[],
  activeIndex = 0
): { activeIndex: number; items: DailyGame[] } {
  const clean = games
    .map((game) => ({
      id: game.id || crypto.randomUUID(),
      name: game.name.trim(),
      description: (game.description ?? "").trim(),
    }))
    .filter((game) => game.name.length > 0);
  return {
    activeIndex: clampGameIndex(activeIndex, clean.length),
    items: clean,
  };
}
