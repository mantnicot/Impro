"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCachedImage,
  getOrFetchImage,
  prefetchImagesParallel,
} from "@/lib/image-search";

interface PreparedWord {
  word: string;
  imageUrl: string | null;
  index: number;
}

export function useGameImages(words: string[], enabled: boolean, useAllWords = false) {
  const [current, setCurrent] = useState<PreparedWord | null>(null);
  const [preparing, setPreparing] = useState(false);
  const shuffledRef = useRef<string[]>([]);
  const wordsKey = useMemo(() => words.join("\0"), [words]);

  useEffect(() => {
    shuffledRef.current = useAllWords ? [...words] : [...words].sort(() => Math.random() - 0.5);
    setCurrent(null);
    if (shuffledRef.current.length > 0) {
      void prefetchImagesParallel(
        useAllWords ? shuffledRef.current : shuffledRef.current.slice(0, 12)
      );
    }
  }, [wordsKey, useAllWords, words]);

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
    setCurrent(first);
    setPreparing(false);
  }, [prepareFromIndex]);

  useEffect(() => {
    if (!enabled || words.length === 0) return;
    void initGame();
  }, [enabled, words.length, wordsKey, initGame]);

  const advance = useCallback(
    async (direction: "next" | "prev"): Promise<PreparedWord | null> => {
      if (!current) return null;

      const list = shuffledRef.current;
      const step = direction === "next" ? 1 : -1;
      const newIndex = (current.index + step + list.length) % list.length;

      setPreparing(true);
      const next = useAllWords
        ? await loadWordAtIndex(newIndex)
        : await prepareFromIndex(newIndex);
      setCurrent(next);
      setPreparing(false);
      return next;
    },
    [current, loadWordAtIndex, prepareFromIndex, useAllWords]
  );

  const warmUp = useCallback(() => {
    void prefetchImagesParallel(shuffledRef.current);
  }, []);

  return { current, preparing, advance, warmUp, initGame };
}
