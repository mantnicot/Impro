import type { DailyGame } from "@/lib/voting/types";
import { clampGameIndex } from "@/lib/voting/parse-games-paste";

export interface DailyGamesPayload {
  games: DailyGame[];
  activeIndex: number;
  /** Fin del reloj en vivo. Solo existe mientras hay un tiempo corriendo. */
  timerEndsAt: string | null;
}

const MAX_GAME_SECONDS = 60 * 60;

export function gameDurationSeconds(game?: Pick<DailyGame, "duration_seconds"> | null): number | null {
  const value = game?.duration_seconds;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return Math.min(MAX_GAME_SECONDS, Math.round(value));
}

export function formatGameDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs === 0) return `${mins} min`;
  if (mins > 0) return `${mins} min ${secs} s`;
  return `${secs} s`;
}

export function parseTimerEndsAt(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString();
}

export function remainingMs(endsAt: string | null | undefined, now = Date.now()): number | null {
  const parsed = parseTimerEndsAt(endsAt);
  if (!parsed) return null;
  return Math.max(0, Date.parse(parsed) - now);
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function parseGameItem(item: unknown): DailyGame | null {
  if (item == null || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const name = String(row.name ?? "").trim();
  if (!name) return null;
  const game: DailyGame = {
    id: String(row.id ?? crypto.randomUUID()),
    name,
    description: String(row.description ?? "").trim(),
  };
  const seconds = gameDurationSeconds({ duration_seconds: Number(row.duration_seconds) });
  if (seconds != null) game.duration_seconds = seconds;
  return game;
}

/** Acepta array legacy o { activeIndex, items/games }. Sin columna nueva. */
export function parseDailyGamesPayload(value: unknown): DailyGamesPayload {
  if (Array.isArray(value)) {
    const games = value.map(parseGameItem).filter((game): game is DailyGame => game != null);
    return { games, activeIndex: 0, timerEndsAt: null };
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
      timerEndsAt: parseTimerEndsAt(row.timerEndsAt),
    };
  }

  return { games: [], activeIndex: 0, timerEndsAt: null };
}

export function serializeDailyGamesPayload(
  games: DailyGame[],
  activeIndex = 0,
  timerEndsAt: string | null = null
): { activeIndex: number; items: DailyGame[]; timerEndsAt?: string } {
  const clean = games
    .map((game) => {
      const item: DailyGame = {
        id: game.id || crypto.randomUUID(),
        name: game.name.trim(),
        description: (game.description ?? "").trim(),
      };
      const seconds = gameDurationSeconds(game);
      if (seconds != null) item.duration_seconds = seconds;
      return item;
    })
    .filter((game) => game.name.length > 0);
  const payload: { activeIndex: number; items: DailyGame[]; timerEndsAt?: string } = {
    activeIndex: clampGameIndex(activeIndex, clean.length),
    items: clean,
  };
  const endsAt = parseTimerEndsAt(timerEndsAt);
  if (endsAt) payload.timerEndsAt = endsAt;
  return payload;
}
