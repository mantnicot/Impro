import { NextRequest, NextResponse } from "next/server";

async function fetchWikipedia(word: string): Promise<string | null> {
  const title = encodeURIComponent(word.trim());
  try {
    const res = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${title}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const src = data.thumbnail?.source as string | undefined;
    if (!src) return null;
    return src.replace(/\/(\d+)px-/, "/800px-");
  } catch {
    return null;
  }
}

async function fetchWikimediaCommons(word: string): Promise<string | null> {
  const q = encodeURIComponent(word.trim());
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json&origin=*`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    for (const page of Object.values(pages) as { imageinfo?: { thumburl?: string; url?: string }[] }[]) {
      const info = page.imageinfo?.[0];
      if (info?.thumburl || info?.url) return info.thumburl || info.url || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchUnsplash(word: string): Promise<string | null> {
  const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key || key === "your_unsplash_access_key") return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(word)}&per_page=1&orientation=landscape&client_id=${key}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

async function fetchPixabay(word: string): Promise<string | null> {
  const key = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
  if (!key || key === "your_pixabay_api_key") return null;
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(word)}&image_type=photo&per_page=3&safesearch=true&lang=es`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.hits?.[0]?.largeImageURL ?? data.hits?.[0]?.webformatURL ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const word = request.nextUrl.searchParams.get("word");
  if (!word) {
    return NextResponse.json({ error: "word required" }, { status: 400 });
  }

  const sources: { fn: () => Promise<string | null>; name: string }[] = [
    { fn: () => fetchWikipedia(word), name: "wikipedia" },
    { fn: () => fetchWikimediaCommons(word), name: "wikimedia" },
    { fn: () => fetchUnsplash(word), name: "unsplash" },
    { fn: () => fetchPixabay(word), name: "pixabay" },
  ];

  for (const { fn, name } of sources) {
    const url = await fn();
    if (url) {
      return NextResponse.json({ url, source: name, alt: word });
    }
  }

  const seed = word.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return NextResponse.json({
    url: `https://picsum.photos/seed/${seed}/1200/900`,
    source: "fallback",
    alt: word,
  });
}
