import {
  AMBIENCE_GENRES_STORAGE_KEY,
  DEFAULT_AMBIENCE_GENRES,
  type AmbienceGenre,
} from "@/lib/ambience-genres";

export function getAmbienceGenres(): AmbienceGenre[] {
  if (typeof window === "undefined") return [...DEFAULT_AMBIENCE_GENRES];
  try {
    const raw = localStorage.getItem(AMBIENCE_GENRES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_AMBIENCE_GENRES];
    const parsed = JSON.parse(raw) as AmbienceGenre[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_AMBIENCE_GENRES;
    return parsed;
  } catch {
    return DEFAULT_AMBIENCE_GENRES;
  }
}

export function saveAmbienceGenres(genres: AmbienceGenre[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AMBIENCE_GENRES_STORAGE_KEY, JSON.stringify(genres));
}

export function resetAmbienceGenres(): AmbienceGenre[] {
  saveAmbienceGenres(DEFAULT_AMBIENCE_GENRES);
  return [...DEFAULT_AMBIENCE_GENRES];
}
