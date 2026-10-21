import type { Artist, ArtistResult } from "@/lib/voting/types";

/** Huella corta: detecta cambio de foto sin mandar el base64 en cada poll. */
export function photoRevision(photo: string | null | undefined): string {
  if (!photo) return "";
  return `${photo.length}:${photo.slice(24, 40)}`;
}

export function artistForPoll(artist: Artist, includePhotos: boolean): Artist {
  const rev = photoRevision(artist.photo_data);
  if (includePhotos) return { ...artist, photo_rev: rev };
  const { photo_data: _photo, ...rest } = artist;
  return { ...rest, photo_data: null, photo_rev: rev };
}

export function mergeArtistPhotos(previous: Artist[], incoming: Artist[]): Artist[] {
  const cache = new Map(previous.map((artist) => [artist.id, artist]));
  return incoming.map((artist) => {
    const prev = cache.get(artist.id);
    return {
      ...artist,
      photo_data: artist.photo_data || prev?.photo_data || null,
    };
  });
}

export function artistsNeedPhotos(previous: Artist[], incoming: Artist[]): boolean {
  const cache = new Map(previous.map((artist) => [artist.id, artist]));
  return incoming.some((artist) => {
    if (!artist.photo_rev) return false;
    const prev = cache.get(artist.id);
    return !prev?.photo_data || prev.photo_rev !== artist.photo_rev;
  });
}

export function mergeResultPhotos(previous: ArtistResult[], incoming: ArtistResult[]): ArtistResult[] {
  return incoming.map((row, index) => {
    const prev =
      previous.find((item) => item.artist.id === row.artist.id) ?? previous[index];
    return {
      ...row,
      artist: {
        ...row.artist,
        photo_data: row.artist.photo_data || prev?.artist.photo_data || null,
      },
    };
  });
}

export function resultsNeedPhotos(previous: ArtistResult[], incoming: ArtistResult[]): boolean {
  const cache = new Map(previous.map((row) => [row.artist.id, row.artist]));
  return incoming.some((row) => {
    if (!row.artist.photo_rev) return false;
    const prev = cache.get(row.artist.id);
    return !prev?.photo_data || prev.photo_rev !== row.artist.photo_rev;
  });
}
