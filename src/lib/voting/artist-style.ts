export type AvatarGender = "male" | "female";

export const ARTIST_COLORS = [
  "#F87171",
  "#FB923C",
  "#FBBF24",
  "#34D399",
  "#22D3EE",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
  "#94A3B8",
  "#A3E635",
];

export const ARTIST_TAGLINES = [
  "El mas chistoso",
  "La mas entretenida",
  "El de las ideas raras",
  "La reina del remate",
  "El que nunca falla",
  "La energia del grupo",
  "El caos elegante",
  "La sorpresa de la noche",
  "El que prende la escena",
  "La que roba miradas",
  "El experto en improvisar",
  "La sonrisa peligrosa",
];

export function normalizeArtistColor(color?: string): string {
  if (!color) return ARTIST_COLORS[0]!;
  return ARTIST_COLORS.includes(color) ? color : ARTIST_COLORS[0]!;
}

export function normalizeAvatarGender(value?: string): AvatarGender {
  return value === "female" ? "female" : "male";
}

export function pickDefaultTagline(index = 0): string {
  return ARTIST_TAGLINES[index % ARTIST_TAGLINES.length]!;
}

export function normalizeTagline(value: string | undefined, fallbackIndex = 0): string {
  const trimmed = value?.trim().slice(0, 48);
  return trimmed || pickDefaultTagline(fallbackIndex);
}
