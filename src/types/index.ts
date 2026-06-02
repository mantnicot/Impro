export interface WordList {
  id: string;
  name: string;
  words: string[];
  createdAt: string;
  isSystem?: boolean;
}

export interface AppSettings {
  logoUrl: string | null;
  darkMode: boolean;
  soundEnabled: boolean;
  presenterMode: boolean;
}

export interface GameSession {
  listId: string;
  listName: string;
  words: string[];
  currentIndex: number;
  usedWords: string[];
}

export type SwipeDirection = "left" | "right" | "up" | "down";

export interface ImageResult {
  url: string;
  source: "unsplash" | "pixabay" | "fallback";
  alt: string;
}
