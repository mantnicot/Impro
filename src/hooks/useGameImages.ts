"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCachedImage,
  getOrFetchImage,
  prefetchImagesParallel,
} from "@/lib/image-search";
import { shuffledCopy } from "@/lib/shuffle";
import { rememberShownObjects } from "@/lib/storage";

interface PreparedWord {
  word: string;
  imageUrl: string | null;
  index: number;
}

const SESSION_RECENT_MAX = 25;

export function useGameImages(words: string[], enabled: boolean, useAllWords = false) {
  const [current, setCurrent] = useState<PreparedWord | null>(null);
  const [preparing, setPreparing] = useState(false);
  const shuffledRef = useRef<string[]>([]);
  const sessionRecentRef = useRef<string[]>([]);
  const wordsKey = useMemo(() => words.join("\0"), [words]);

  useEffect(() => {
    shuffledRef.current = useAllWords ? [...words] : shuffledCopy(words);
    sessionRecentRef.current = [];
    setCurrent(null);
    if (shuffledRef.current.length > 0) {
      void prefetchImagesParallel(
        useAllWords ? shuffledRef.current : shuffledRef.current.slice(0, 12)
      );
    }
  }, [wordsKey, useAllWords, words]);

  const rememberWord = useCallback((word: string) => {
    const key = word.trim().toLowerCase();
    const recent = sessionRecentRef.current.filter((w) => w.toLowerCase() !== key);
    sessionRecentRef.current = [word, ...recent].slice(0, SESSION_RECENT_MAX);
    rememberShownObjects([word]);
  }, []);

  const findNextIndex = useCallback(
    (fromIndex: number, direction: 1 | -1): number => {
      const list = shuffledRef.current;
      if (list.length === 0) return 0;

      const recent = new Set(sessionRecentRef.current.map((w) => w.trim().toLowerCase()));

      for (let step = 1; step <= list.length; step++) {
        const normalized = (fromIndex + step * direction + list.length) % list.length;
        const candidate = list[normalized];
        if (!recent.has(candidate.trim().toLowerCase())) return normalized;
      }

      return (fromIndex + direction + list.length) % list.length;
    },
    []
  );

  const loadWordAtIndex = useCallback(async (index: number): Promise<PreparedWord | null> => {
    const list = shuffledRef.current;
    if (list.length === 0) return null;

    const safeIndex = ((index % list.length) + list.length) % list.length;
    const word = list[safeIndex];
    const cached = getCachedImage(word);
    const imageUrl = cached ?? (await getOrFetchImage(word));

    return { word, imageUrl, index: safeIndex };
  }, []);

  const prepareFromIndex = useCallback(
    async (startIndex: number): Promise<PreparedWord | null> => {
      const list = shuffledRef.current;
      if (list.length === 0) return null;

      if (useAllWords) {
        return loadWordAtIndex(startIndex);
      }

      for (let offset = 0; offset < list.length; offset++) {
        const index = (startIndex + offset) % list.length;
        const word = list[index];
        const cached = getCachedImage(word);
        if (cached) return { word, imageUrl: cached, index };
        const imageUrl = await getOrFetchImage(word);
        if (imageUrl) return { word, imageUrl, index };
      }

      return null;
    },
    [loadWordAtIndex, useAllWords]
  );

  const initGame = useCallback(async () => {
    setPreparing(true);
    const first = await prepareFromIndex(0);
    if (first) rememberWord(first.word);
    setCurrent(first);
    setPreparing(false);
  }, [prepareFromIndex, rememberWord]);

  useEffect(() => {
    if (!enabled || words.length === 0) return;
    void initGame();
  }, [enabled, words.length, wordsKey, initGame]);

  const advance = useCallback(
    async (direction: "next" | "prev"): Promise<PreparedWord | null> => {
      if (!current) return null;

      const step = direction === "next" ? 1 : -1;
      const newIndex = useAllWords
        ? (current.index + step + shuffledRef.current.length) % shuffledRef.current.length
        : findNextIndex(current.index, step as 1 | -1);

      setPreparing(true);
      const next = useAllWords
        ? await loadWordAtIndex(newIndex)
        : await prepareFromIndex(newIndex);
      if (next) rememberWord(next.word);
      setCurrent(next);
      setPreparing(false);
      return next;
    },
    [current, findNextIndex, loadWordAtIndex, prepareFromIndex, rememberWord, useAllWords]
  );

  const warmUp = useCallback(() => {
    void prefetchImagesParallel(shuffledRef.current);
  }, []);

  return { current, preparing, advance, warmUp, initGame };
}
