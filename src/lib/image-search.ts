import { FOOD_TERMS, RELEVANCE, TOOL_TERMS, WIKI_EN_ARTICLE } from "./object-images";

const CACHE_VERSION = "v5";

export function extractObjectTerm(word: string): string {
  const cleaned = word.trim();
  const first = cleaned.split(/\s+/)[0] ?? cleaned;
  return first.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

const BAD_EXT = /\.(svg|pdf|djvu|webm|ogv|gif|tiff)$/i;

const BAD_META =
  /portrait|wearing|logo|advert|poster|comic|chase|theatre|theater|playwright|comedia|enrique perez|programme/i;

const BAD_FOR_TOOLS =
  /stew|curry|chili|guiso|cocido|recipe|served|meal|plated|garnish|meat dish|food on|dish with|sauce on|carne/i;

function capitalize(term: string): string {
  return term.charAt(0).toUpperCase() + term.slice(1);
}

function preloadInBrowser(url: string): void {
  if (typeof window === "undefined") return;
  const img = new Image();
  img.src = url;
}

async function fetchWikiImage(lang: "en" | "es", title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const src = data.thumbnail?.source as string | undefined;
    if (!src || BAD_EXT.test(src)) return null;
    return src;
  } catch {
    return null;
  }
}

function isRelevantImage(term: string, label: string, url: string): boolean {
  const text = `${label} ${url}`.toLowerCase();

  if (BAD_META.test(text)) return false;

  if (TOOL_TERMS.has(term) && BAD_FOR_TOOLS.test(text)) return false;

  if (TOOL_TERMS.has(term) && !FOOD_TERMS.has(term)) {
    if (/food|stew|soup in|bowl of|served|meat|carne/i.test(text)) return false;
  }

  if (FOOD_TERMS.has(term)) {
    if (/logo|brand|package|box of|cereal box|label|advert/i.test(text)) return false;
  }

  const relevance = RELEVANCE[term];
  if (relevance && !relevance.test(text)) return false;

  return true;
}

async function tryArticle(term: string, article: string): Promise<string | null> {
  const url = await fetchWikiImage("en", article);
  if (url && isRelevantImage(term, article, url)) {
    preloadInBrowser(url);
    return url;
  }
  return null;
}

export async function fetchObjectImageUrl(word: string): Promise<string | null> {
  const term = extractObjectTerm(word);
  const titled = capitalize(term);

  const mapped = WIKI_EN_ARTICLE[term];
  if (mapped) {
    const found = await tryArticle(term, mapped);
    if (found) return found;
  }

  // Wikipedia ES — funciona para palabras en español (Gato, Perro, etc.)
  const esUrl = await fetchWikiImage("es", titled);
  if (esUrl && isRelevantImage(term, titled, esUrl)) {
    preloadInBrowser(esUrl);
    return esUrl;
  }

  // Wikipedia EN con el término capitalizado (palabras internacionales)
  const enUrl = await fetchWikiImage("en", titled);
  if (enUrl && isRelevantImage(term, titled, enUrl)) {
    preloadInBrowser(enUrl);
    return enUrl;
  }

  return null;
}

const imageCache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

function cacheKey(word: string): string {
  return `${CACHE_VERSION}:${word.trim().toLowerCase()}`;
}

function loadSessionCache(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(`tava-img-${CACHE_VERSION}`);
    if (!raw) return;
    const entries = JSON.parse(raw) as [string, string][];
    entries.forEach(([k, v]) => imageCache.set(k, v));
  } catch {
    /* ignore */
  }
}

function saveSessionCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `tava-img-${CACHE_VERSION}`,
      JSON.stringify([...imageCache.entries()])
    );
  } catch {
    /* ignore */
  }
}

loadSessionCache();

export function getCachedImage(word: string): string | undefined {
  return imageCache.get(cacheKey(word));
}

export function cacheImage(word: string, url: string): void {
  imageCache.set(cacheKey(word), url);
  saveSessionCache();
}

export async function getOrFetchImage(word: string): Promise<string | null> {
  const key = cacheKey(word);
  const cached = imageCache.get(key);
  if (cached) return cached;

  const inFlight = pending.get(key);
  if (inFlight) return inFlight;

  const promise = fetchObjectImageUrl(word).then((url) => {
    pending.delete(key);
    if (url) {
      imageCache.set(key, url);
      saveSessionCache();
    }
    return url;
  });

  pending.set(key, promise);
  return promise;
}

export function prefetchImage(word: string): void {
  if (imageCache.has(cacheKey(word))) return;
  void getOrFetchImage(word);
}

export function prefetchImages(words: string[]): void {
  words.forEach((w) => prefetchImage(w));
}

export async function prefetchImagesParallel(words: string[]): Promise<void> {
  await Promise.all(words.map((w) => getOrFetchImage(w)));
}

export function clearImageCache(): void {
  imageCache.clear();
  pending.clear();
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(`tava-img-${CACHE_VERSION}`);
  }
}
