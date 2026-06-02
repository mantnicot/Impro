import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AppSettings, WordList } from "@/types";
import {
  DEFAULT_OBJECTS,
  FAVORITES_LIST_ID,
  FAVORITES_LIST_NAME,
} from "./default-words";

const DB_NAME = "tava-roulette";
const DB_VERSION = 1;
const SETTINGS_KEY = "tava-settings";
const STATS_KEY = "tava-word-stats";

interface TavaDB extends DBSchema {
  lists: {
    key: string;
    value: WordList;
  };
}

let dbPromise: Promise<IDBPDatabase<TavaDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TavaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("lists")) {
          db.createObjectStore("lists", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function initStorage(): Promise<void> {
  const db = await getDB();
  const favorites = await db.get("lists", FAVORITES_LIST_ID);
  if (!favorites) {
    await db.put("lists", {
      id: FAVORITES_LIST_ID,
      name: FAVORITES_LIST_NAME,
      words: [],
      createdAt: new Date().toISOString(),
      isSystem: true,
    });
  }
}

export async function getAllLists(): Promise<WordList[]> {
  const db = await getDB();
  return db.getAll("lists");
}

export async function getList(id: string): Promise<WordList | undefined> {
  const db = await getDB();
  return db.get("lists", id);
}

export async function saveList(list: WordList): Promise<void> {
  const db = await getDB();
  await db.put("lists", list);
}

export function parseWordsInput(text: string): string[] {
  return text
    .split(/[,;\n\r]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

export async function createList(name: string, wordsText: string): Promise<WordList> {
  const words = parseWordsInput(wordsText);

  const list: WordList = {
    id: crypto.randomUUID(),
    name,
    words,
    createdAt: new Date().toISOString(),
  };
  await saveList(list);
  return list;
}

export async function updateList(
  id: string,
  updates: Partial<Pick<WordList, "name" | "words">>
): Promise<WordList | null> {
  const existing = await getList(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  await saveList(updated);
  return updated;
}

export async function deleteList(id: string): Promise<boolean> {
  if (id === FAVORITES_LIST_ID) return false;
  const db = await getDB();
  await db.delete("lists", id);
  return true;
}

export async function addToFavorites(word: string): Promise<void> {
  const normalized = word.trim();
  if (!normalized) return;

  const db = await getDB();
  const tx = db.transaction("lists", "readwrite");
  const store = tx.objectStore("lists");
  const favorites = await store.get(FAVORITES_LIST_ID);
  if (!favorites) {
    await tx.done;
    return;
  }

  const exists = favorites.words.some(
    (w) => w.trim().toLowerCase() === normalized.toLowerCase()
  );
  if (exists) {
    await tx.done;
    return;
  }

  favorites.words.push(normalized);
  await store.put(favorites);
  await tx.done;
}

export async function removeFromFavorites(word: string): Promise<void> {
  const normalized = word.trim();
  if (!normalized) return;

  const db = await getDB();
  const tx = db.transaction("lists", "readwrite");
  const store = tx.objectStore("lists");
  const favorites = await store.get(FAVORITES_LIST_ID);
  if (!favorites) {
    await tx.done;
    return;
  }

  favorites.words = favorites.words.filter(
    (w) => w.trim().toLowerCase() !== normalized.toLowerCase()
  );
  await store.put(favorites);
  await tx.done;
}

export function getRandomWords(count = 50): string[] {
  const shuffled = [...DEFAULT_OBJECTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getSettings(): AppSettings {
  if (typeof window === "undefined") {
    return { logoUrl: null, darkMode: false, soundEnabled: true, presenterMode: false };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as AppSettings;
  } catch {
    /* ignore */
  }
  return { logoUrl: null, darkMode: false, soundEnabled: true, presenterMode: false };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function recordWordUsage(word: string): void {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    const stats: Record<string, number> = raw ? JSON.parse(raw) : {};
    stats[word] = (stats[word] || 0) + 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

export function getWordStats(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function exportListsData(lists: WordList[]): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), lists }, null, 2);
}

export async function importListsData(json: string): Promise<number> {
  const data = JSON.parse(json) as { lists: WordList[] };
  let count = 0;
  for (const list of data.lists) {
    if (list.id === FAVORITES_LIST_ID) continue;
    await saveList({ ...list, id: crypto.randomUUID() });
    count++;
  }
  return count;
}

export function saveLogoDataUrl(dataUrl: string): void {
  const settings = getSettings();
  settings.logoUrl = dataUrl;
  saveSettings(settings);
}
