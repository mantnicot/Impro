"use client";

import { useQuery } from "@tanstack/react-query";
import type { ImageResult } from "@/types";

async function fetchWikipediaClient(word: string): Promise<ImageResult | null> {
  try {
    const res = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word.trim())}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const src = data.thumbnail?.source as string | undefined;
    if (!src) return null;
    return {
      url: src.replace(/\/(\d+)px-/, "/800px-"),
      source: "unsplash",
      alt: data.description || word,
    };
  } catch {
    return null;
  }
}

async function fetchWikimediaClient(word: string): Promise<ImageResult | null> {
  try {
    const q = encodeURIComponent(word.trim());
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json&origin=*`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    for (const page of Object.values(pages) as {
      imageinfo?: { thumburl?: string; url?: string }[];
    }[]) {
      const info = page.imageinfo?.[0];
      const url = info?.thumburl || info?.url;
      if (url) return { url, source: "pixabay", alt: word };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchImage(word: string): Promise<ImageResult> {
  const wiki = await fetchWikipediaClient(word);
  if (wiki) return wiki;

  const commons = await fetchWikimediaClient(word);
  if (commons) return commons;

  try {
    const res = await fetch(`/api/image?word=${encodeURIComponent(word)}`);
    if (res.ok) return res.json();
  } catch {
    /* ignore */
  }

  const seed = word.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    url: `https://picsum.photos/seed/${seed}/1200/900`,
    source: "fallback",
    alt: word,
  };
}

export function useWordImage(word: string | null) {
  return useQuery({
    queryKey: ["word-image", word],
    queryFn: () => fetchImage(word!),
    enabled: !!word,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
